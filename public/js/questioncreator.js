const bankTypeSelected = localStorage.getItem("bankType");
const bankTypeText = document.querySelector("#bankIndicatorText");
const classroomSelectedText = document.querySelector("#classroomIndicatorText");

let res;

// Si el banco es privado, mostramos la información ya que son independientes.
// Si es publico no interesa, puesto que este ultimo es global.
if (bankTypeSelected == "private") {
    classroomSelectedText.innerHTML = localStorage.getItem("classroomBankSelectionViewInput");
}

// Segun la sesion iniciada, muestra un encabezado distinto.
if (session.entityName == "teacher") {
    bankTypeText.innerHTML = `Creación de preguntas ${bankTypeSelected == "private" ? "privadas" : "publicas"}`;
} else if (session.entityName == "student") {
    bankTypeText.innerHTML = `Visualización de preguntas ${bankTypeSelected == "private" ? "privadas" : "publicas"}`
}

$(document).ready(function() {
    instanceViews();
});

// Instancia las vistas segun la sesión
async function instanceViews(){
    // Maqueta el boton de crear encuesta, si la sesion es de profesor, lo reemplaza, si es estudiante lo oculta.
    instanceCreateQuestionButton(); 

    // Obtiene el codigo unico del banco seleciconado, si el banco es publico responde con 1
    const code = getSelectedBankCode();
    if (!code) return;
    
    // Obtiene las preguntas segun el banco
    if (bankTypeSelected == "private") res = await getInfo(`getQuestionsByClassroomCode?code=${code}`);
    else if (bankTypeSelected == "public") res = await getInfo(`getQuestionsByPublicBank`);
    if (res.status == 400) return alert("Ha ocurrido un error al localizar la información, intente de nuevo más tarde.");

    // Existe el banco, pero no hay preguntas, entonces notificamos.
    if (!res.data || (session.entityName == "student" && !JSON.parse(res.data).find(elem => elem.showtostudents == 1))) {
        $("#warn-message").parent().attr("class", "center")
        $("#warn-message").replaceWith(`
                <div class="warn-message-presentation">
                    <p>No existen preguntas publicas a estudiantes en este banco</p>
                </div>`);
        $("#load_questions").replaceWith(`<div style="display: none"></div>`);
        $("#load_questions_view").replaceWith(`<div style="display: none"></div>`);
        return;
    }

    // Maqueta las preguntas para la vista, y para una ventana que muestra la información completa de estas
    const questions = JSON.parse(res.data);
    var txtQuestions = "", txtQuestionsResume = "";
    questions.forEach((question, index) => {
        txtQuestions += instanceQuestion(question, index);
        txtQuestionsResume += instanceQuestionVisualization(question, index);
    });

    $("#load_questions").replaceWith(txtQuestions);
    $("#load_questions_view").replaceWith(txtQuestionsResume);
    $("#warn-message").replaceWith(`<div style="display: none"></div>`);
}

function instanceCreateQuestionButton() {
    let create_question_btn = `<div class="total-width">     
        <div onclick="openWindow('#divOne')" class="question_button_area question_create_button">
            <div class="total-width total-height white-text flex align center">                     
                <i class="large-font fa fa-user"></i>
                <p style="margin-left: 1em;" class="small-font white-text" id="classroom_button_text">Crear pregunta</p>                    
            </div>                   
        </div>
    </div>`

    if (session.entityName == "teacher") {
        $("#create-question-button").replaceWith(create_question_btn);
    } else if (session.entityName == "student") {
        $("#create-question-button").replaceWith(`<div style="display: none"></div>`);
    }
}

// Instancia las preguntas para mostrarlas en la vista
function instanceQuestion(question, index) {
    // Si la sesión es de un estudiante, pero la pregunta no esta marcada como publica para estudiante, no la maqueta
    if (session.entityName == "student" && question.showtostudents == 0) return "";

    const MAX_QUESTION_TITLE_LENGTH = 35; // Maximo numero de caracteres antes de cortar el texto en la presentación de la vista
    const options = JSON.parse(question.options);

    text = `
    <div onclick="openWindow('#div${index}')" class="pointer question-presentation flex">
        <div id="question-button-${index}" class="questions-text-button total-height">
            <p class="question-title">${formatText(question.title, MAX_QUESTION_TITLE_LENGTH)}</p>
            <p class="question-options-number">Cantidad de opciones: ${options.length}</p>
            <p class="question-id">ID de la pregunta: ${question.id}</p>
        </div>

        ${session.entityName == "student" ? "" : 
        `<div onclick="deleteQuestion(event, ${question.id})" class="delete-question-button align center right">
            <i class="fas fa-bomb"></i>
        </div>`}                
    </div>`
    
    return text;
}

// Instancia la ventana donde se muestra la pregunta (que se selecciona) completa
function instanceQuestionVisualization(question, index) {
    const options = JSON.parse(question.options);
    let answers = "", view = "";

    // Declara las opciones, con el texto completo y con su imagen, si tiene.
    for(let option of options) {
        answers += `
        <div class="${option.valid ? "answers-valid-option-presentation" : "answers-option-presentation"}">
            <p>${option.title}</p>
            ${option.url && option.url.length != 0 && isValidUrl(option.url) ? `<img src="${option.url}"/>` : ""}
        </div>
        `;
    }

    // Maqueta
    view = `
    <div class="overlay" style="overflow-y: auto;display: block;" id="div${index}">
        <div class="wrapper" style="width: 50%; margin-top: 1%;">
            <h2>Visualización de la pregunta</h2><a class="close" href="#">&times;</a>
            <div class="content">
                <div class="container">                    
                    <p style="font-size:1em; margin-right: 1em;" class="question-title-view">${question.title}</p>
                    <div style="width: 30em; heigth: 20em; margin-top: 2%;">
                    ${question.url && question.url.length != 0 && isValidUrl(question.url) ? `<img style="object-fit: cover;" src="${question.url}"/>` : ""}
                    </div>
                    <div class="answers-presentation">${answers}</div>                         
                </div>
            </div>
        </div>
    </div>`
 
    return view;
}

async function deleteQuestion(e, questionId) {
    e.preventDefault();

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();

    let res = await postInfo({
        task: "delete_question",
        data: questionId
    });

    if (res.status == 400) return alert("No ha sido posible eliminar la pregunta, intente de nuevo más tarde.");

    if (res.status == 200) {
        alert("Pregunta eliminada satisfactoriamente.");
        window.location.assign("../html/createquestion.html");
    }
}

$('#createQuestionBtn').click(function(){
    let questionTypeSelected = localStorage.getItem("questionTypeSelected");
    if (!questionTypeSelected) return alert("Por favor, selecciona un tipo de pregunta.");

    let questionTitle = $("#title-text").val();
    if (questionTitle.length == 0) return alert("Por favor, escribe un enunciado para la pregunta.");

    let listLength = $("#total-list li").length;
    if (listLength <= 1 && listLength == 0 && questionTypeSelected != "Llena los espacios" && questionTypeSelected != "Subir un link") return alert("Por favor, selecciona al menos dos opciones de respuesta.");

    let optionChecked = valideOptionChecked();
    if (!optionChecked && questionTypeSelected != "Llena los espacios" && questionTypeSelected != "Subir un link") return alert("Por favor, seleccione cual será la respuesta correcta.");

    let everyAnswerHasTitle = checkEveryAnswerTitle();
    if (!everyAnswerHasTitle) return alert("Por favor, ingrese los enunciados para todas las opciones de respuesta.");

    let imageURL = $("#image-url").val();
    let showToStudentsOption = showToStudentsToggle(); // Obtiene si la pregunta es publica o no a estudiantes, segun el color del switch

    // Obtiene las opciones de respuesta directamente del html, 
    // la opción correcta la filtra por el color del elemento
    // (recordar que al seleccionar que opción sera correcta
    // el color del bordeado cambia respecto a las demas opciones)
    let answerOptions = getAnswerOptions(); 

    let entity = {
        questionType: questionTypeSelected,
        title: questionTitle,
        url: imageURL,
        options: answerOptions,
        isPublic: bankTypeSelected == "public" ? 1 : 0,
        bankId: null,
        showToStudents: showToStudentsOption
    };

    registerQuestion(entity);
});

async function registerQuestion(entity) {
    // Obtiene la información del banco, si es publico, el identificador será simplemente 1
    // si es privado, filtramos la info segun el banco seleccionado y la validamos con el backend
    if (entity.isPublic) {
       entity.bankId = "1"; 
    } else {
        code = getSelectedBankCode();
        res = await getInfo(`getBankIdByClassroomCode?code=${code}`);
        if (!res.data) return alert("Ha ocurrido un error obteniendo su banco privado, intente de nuevo más tarde.")
        entity.bankId = res.data;
    }
    
    res = await postInfo({
        task: "register_question",
        data: entity
    });

    if (res.status == 400) return alert("No ha sido posible crear la pregunta, intente de nuevo más tarde.");
    
    if (res.status == 200) {
        alert("Pregunta registrada satisfactoriamente.");
        window.location.assign("../html/createquestion.html");
    }
}

function showToStudentsToggle() {
    let toggleRgbValue = $(".toggler-slider").css("border-color");
    switch(toggleRgbValue) {
        case "rgb(68, 204, 102)": // YES
            return 1;
        case "rgb(235, 79, 55)": // NO
            return 0;
    }
}

function valideOptionChecked() {
    let result = false;
    
    $("#total-list ul").children().each(function(_, elem) {
        let validBorder = "5px double rgb(0, 255, 0)";
        if (elem.style.border == validBorder) result = true;
    });

    return result;
}

function checkEveryAnswerTitle() {
    let result = true;

    $("#total-list ul").children().each(function(index) {
        let txtValue = $(`#submission-line-1-${index}`).val();
        if (txtValue.length == 0) result = false;
    });

    return result;
}

function getAnswerOptions() {
    let totalOptions = [];
    $("#total-list ul").children().each(function(index, elem) {
        let titleValue = $(`#submission-line-1-${index}`).val();
        let imgUrlValue = $(`#submission-line-2-${index}`).val();
        let validBorder = "5px double rgb(0, 255, 0)";
        let elementColor = $(`#submission-line-1-${index}`).parent().parent().css("border");

        totalOptions.push({
            title: titleValue,
            url: imgUrlValue,
            valid: elementColor == validBorder ? true : false
        })
    });

    return totalOptions;
}

function getSelectedBankCode() {
    let selectedBank = localStorage.getItem("classroomBankSelectionViewInput");   
    if (!selectedBank) return null;
    if (selectedBank == 1) return 1;     

    let code = selectedBank.split("-")[1];
    return code;
}

// Validar si un string es una URL
const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    return urlPattern.test(urlString);
}

function formatText(string, length) {
    if (string.length > length)
        return string.substring(0,length)+'...';
    else
        return string;
}

function openFullText(e, fullText) {
    e.preventDefault();
    $("#option-text").append(fullText);
    window.location.assign("#divTwo");
}

function openWindow(windowId) {
    window.location.assign(windowId);
    clearTotalList();
};