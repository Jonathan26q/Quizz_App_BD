const classroomIdentifier = document.querySelector("#classroomIdentifier");
const REDIRECT_TO_FORMULARY = true;

$(document).ready(function() {
    instanceViews(); // Instancia las vistas una vez se cargue el documento
});

async function instanceViews() {
    instanceCreateSurveyButton(); // Instancia el boton de crear encuesta segun la sesión

    let entityName = session.entityName;
    // Segun el modelo de datos, tenemos dos formas distintas de acceder a los classrooms, depende de la sesión.
    if (entityName == "teacher") {
        res = await getInfo(`getClassroomsByTeacherUsername?username=${session.username}`);
    } else if (entityName == "student") {
        res = await getInfo(`getClassroomsByStudentUsername?username=${session.username}`);
    }

    if (!res.data) { // No hay classrooms registrados, notificamos
        $("#questions-menu-presentation").attr("href", "");
        $("#warn-message").parent().parent().css("width", "auto")
        $("#warn-message").parent().css("border", "none")
        $("#warn-message").replaceWith(`
        <div class="warn-message-createq-presentation">
            <p>No existen classrooms enlazados a tu cuenta</p>
        </div>`);
        return;
    }

    let classrooms = JSON.parse(res.data);

    // Para evitar conflicto entre selectores (el que selecciona un classroom para mostrar encuestas,
    // y el que selecciona un classroom para asignarlo en la creación de encuesta, los definimos separados);
    instanceClassroomViewSelector(classrooms, "#select-classroom-view"); // Seleccionar classroom para mostrar encuestas
    instanceClassroomOptionsSelector(classrooms, "#classroom-options"); // Seleccionar classroom para asignar encuesta

    let classroomSelected = localStorage.getItem("classroomSelectionViewInput");
    if (!classroomSelected) return setWarnMessage("Selecciona un classroom para visualizar las encuestas.");

    let dataClassroom = await getClassroom(classroomSelected);
    if (!dataClassroom.data) return setWarnMessage("Selecciona un classroom válido para visualizar las encuestas.");

    // Tenemos un classroom seleccionado, ahora toca averiguar si tiene encuestas.
    instanceSurveysPresentation(dataClassroom.data, session);
}

function instanceCreateSurveyButton() {
    let create_survey_area_presentation = `
        <div class="question-area-presentation total-width">     
            <div class="survey_button_area survey_create_button">
                <a class="pointer" onclick="openCreateSurveyView(event, '#divOne')" id="questions-menu-presentation">
                    <div class="total-width total-height white-text flex align center">                     
                        <i class="large-font fa fa-user"></i><p style="margin-left: 1em;">Crear encuesta</p>
                    </div>                
                </a>                
            </div>
        </div>`;
    if (session.entityName == "teacher") {
        $("#create-survey-button-presentation").replaceWith(create_survey_area_presentation);
    } else if (session.entityName == "student"){
        $("#create-survey-button-presentation").replaceWith(`<div style="display: none"></div>`);
    }
}

async function instanceSurveysPresentation(classroom, session) {
    let txt;

    // Buscamos las encuestas segun el classroom seleccionado, al profesor
    // enseñaremos todas las encuestas del classroom, al estudiante solo las que tenga
    // individualmente pendientes en ese classroom
    if (session.entityName == "teacher") {
        res = await getInfo(`getSurveysByClassroomCode?code=${classroom.classroomcode}`);
    } else if (session.entityName == "student") {
        res = await getInfo(`getSurveysByStudentUsernameAndClassroomCode?data=${session.username}-${classroom.classroomcode}`);
    }

    if (!res.data) return setWarnMessage(`${classroom.classroomname}: No tienes encuestas pendientes en este classroom.`);
    let surveys = JSON.parse(res.data);

    // Desplegamos las encuestas
    txt = instanceSurveys(surveys, classroom, session.entityName == "student" ? REDIRECT_TO_FORMULARY : null)

    $("#surveys-view").replaceWith(txt);
}

function instanceSurveys(surveys, classroom, redirectToFormulary) {
    let txt = "";
    for(let survey of surveys) {
        // Maquetamos las encuestas segun la información que tenemos
        // No mandamos el identificador de la encuesta ya a los profesores, 
        // a estos los redirigimos al classroom en lugar de al formulario
        txt += surveyPresentation(survey, classroom, redirectToFormulary ? survey.key : undefined);
    }
    return txt;
}

function surveyPresentation(survey, classroom, surveyId) {
    return `<div class="survey-area-presentation total-width">     
        <div class="survey_button_area survey_create_button">
            <a class="pointer" id="questions-menu-presentation" onclick="redirectToSurveyView(event, '${surveyId}')">
                <div class="total-width total-height white-text flex">                                
                    <div class="survey-title-area">
                        <p class="survey-title">${survey.surveyTitle}</p>
                        <p class="question-options-number">Cantidad de preguntas: ${survey.quantity}</p>
                    </div>
                    <div class="right" style="display:block;margin-top:1%;margin-right:1%">
                        <p>${classroom.classroomname}</p>
                        <p>${classroom.classroomcode}</p>
                    </div>
                </div>
            </a>                
        </div>
    </div>`
}

function openCreateSurveyView(e, viewId) {
    e.preventDefault();
    window.location.assign(viewId);
}

function redirectToSurveyView(e, surveyKey) {
    e.preventDefault();
    if (surveyKey == "undefined") return window.location.assign("../html/classrooms.html");
    loadQuestions(surveyKey);
}

// Si el usuario hace click sobre la encuesta, verificamos la existenica de esta en el backend, 
// su relación con el classroom y si todo esta bien, cargamos las preguntas correspondientes.
async function loadQuestions(surveyKey) {
    let surVres = await getInfo(`getSurveyBySurveyCode?code=${surveyKey}`);
    if (!surVres.data) return alert("Hubo un error al momento de obtener la encuesta, intenta de nuevo más tarde.");
    let quantity = surVres.data.quantity;
    let classroomCode = surVres.data.classroomid;

    if (!checkActualDate(surVres.data.datesurvey)) return alert(`La fecha de la encuesta ${surVres.data.datesurvey} no coincide con la fecha actual.`);

    let questions = [];
    if (JSON.parse(surVres.data.questionstoinclude).length > 0) {
        let res = await getInfo(`getQuestionsByIds?data=${surVres.data.questionstoinclude}-${quantity}-${classroomCode}`);
        if (!res.data) return alert("Hubo un error al momento de obtener el cuestionario, es posible que no hayan preguntas registradas, intente de nuevo más tarde.");
        questions = JSON.parse(res.data);
    } else {
        let res = await getInfo(`getQuestionsByQuantity?data=${quantity}-${classroomCode}`);
        if (!res.data) return alert("Hubo un error al momento de obtener el cuestionario, es posible que no hayan preguntas registradas, intente de nuevo más tarde.");
        questions = JSON.parse(res.data);    
    }

    localStorage.setItem("surveyDataSaved", JSON.stringify(surVres.data));
    localStorage.setItem("lastSurvey", surveyKey);
    localStorage.setItem("quizQuestions", JSON.stringify(questions));
    window.location.assign("../html/quiz.html");
}

function checkActualDate(fecha) {
    const fechaActual = new Date();
    const [dia, mes, anio] = fecha.split('/');
    const fechaIngresada = new Date(anio, mes - 1, dia);
  
    if (
      fechaIngresada.getDate() === fechaActual.getDate() &&
      fechaIngresada.getMonth() === fechaActual.getMonth() &&
      fechaIngresada.getFullYear() === fechaActual.getFullYear()
    ) {
      return true; // Las fechas son iguales
    } else {
      return false; // Las fechas son diferentes
    }
  }

async function createSurvey(e) {
    e.preventDefault();

    let titleText = $("#survey_name").val();
    if (titleText.length == 0) return alert("Por favor, ingresa un nombre para la encuesta");

    let classroomSelected = localStorage.getItem("classroomCreateSurvey");
    if (!classroomSelected) return alert("Por favor, selecciona un classroom.");

    let quantity = $("#quantity-questions").val();
    if (quantity.length == 0 || !parseInt(quantity) || parseInt(quantity) > 20 || parseInt(quantity) < 1) 
        return alert("Por favor, selecciona una cantidad de pregunta entre 1 y 20.");

    let umbral = $("#quantity-umbral").val();
    if (umbral.length == 0 || !parseInt(umbral) || parseInt(umbral) < 100) 
        return alert("Por favor, selecciona un umbral superior a 100.");

    let percent = $("#quantity-percent").val();
    if (percent.length == 0 || !parseInt(percent) || parseInt(percent) > 100 || parseInt(percent) < 1) 
        return alert("Por favor, selecciona un porcentaje entre 1 y 100.");

    let questionsToInclude = [];
    if ($("#questions_include").val().length != 0) questionsToInclude = checkQuestionsToInclude($("#questions_include").val());
    if ($("#questions_include").val().length != 0 && !questionsToInclude) return alert("Por favor, ingrese ids validas de las preguntas a incluir."); 

    let timeSurvey = $("#time-survey").val();
    if (timeSurvey.length == 0 || !parseInt(timeSurvey) || parseInt(timeSurvey) < 1) 
        return alert("Por favor, selecciona un tiempo mayor a 1 minuto");

    let dateSurvey = checkDate($("#date-survey").val());
    if (!dateSurvey) return alert("Por favor, ingrese una fecha válida.");

    let classroomSelectedId = classroomSelected.split("-")[1];
    let entity = {
        surveyTitle: titleText,
        classroomId: classroomSelectedId,
        quantity: parseInt(quantity),
        percent: parseInt(percent),
        umbral: parseInt(umbral),
        questionsToInclude: questionsToInclude,
        timeSurvey: parseInt(timeSurvey),
        dateSurvey: dateSurvey
    }

    let res = await postInfo({
        task: "create_survey",
        data: entity
    });

    if (res.status == 400) return alert("Ha ocurrido un error al momento de crear esta encuesta.");
    
    if (res.status == 200) {
        alert(`Creación satisfactoria de la encuesta con el nombre ${titleText}.`);
        window.location.assign("../html/surveys.html");
    }
};

function checkQuestionsToInclude(str) {
    const pattern = /^[\d,\s]+$/;
  
    if (pattern.test(str)) {
        const numbers = str.replace(/\s/g, '').split(',');
        const result = numbers.map(Number);
        return result;
    } else {
        return false;
    }
}

function checkDate(fechaStr) {
    const formatoFecha = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    if (!formatoFecha.test(fechaStr)) {
      return false;
    }

    const [, dia, mes, anio] = formatoFecha.exec(fechaStr);
    const fechaObj = new Date(anio, mes - 1, dia);

    if (
      fechaObj.getFullYear() !== parseInt(anio) ||
      fechaObj.getMonth() !== parseInt(mes) - 1 ||
      fechaObj.getDate() !== parseInt(dia)
    ) {
      return false;
    }

    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00.000

    if (
      fechaObj.getFullYear() === fechaActual.getFullYear() &&
      fechaObj.getMonth() === fechaActual.getMonth() &&
      fechaObj.getDate() === fechaActual.getDate()
    ) {
      return fechaStr;
    }

    if (fechaObj > fechaActual) {
      return fechaStr;
    }

    return false;
}

// Obtener el codigo del classroom seleccionado para la vista
async function getClassroom(dropdownClassroomSelected) {
    let dropdownClassroomSelectedCode = dropdownClassroomSelected.split("-")[1];
    let res = await getInfo(`getClassroomByCode?code=${dropdownClassroomSelectedCode}`);
    return res;
}

function instanceClassroomViewSelector(classrooms, div) {
    let options = "";
    // Instanciamos la lista de opciones
    for(let classroom of classrooms) {
        let v = `${classroom.classroomname}-${classroom.classroomcode}`;
        options += `<li class="option-text" id="${v}">${v}</li>`
    }

    let text = `
    <div class="dropdown">
        <div class="select">
        <span>Selecciona el classroom</span>
        <i class="fa fa-chevron-left"></i>
        </div>
        <input type="hidden">
        <ul class="dropdown-menu">
        ${options}
        </ul>
    </div>`

    $(div).replaceWith(`<div>${text}</div>`); // Reemplazamos
    instanceDropdown(); // Ejecutamos la instancia
    return true;
};

function instanceClassroomOptionsSelector(classrooms, div) {
    let options = "";
    // Instanciamos la lista de opciones
    for(let classroom of classrooms) {
        let v = `${classroom.classroomname}-${classroom.classroomcode}`;
        options += `<option value="${v}*">${v}</option>`
    }

    // Notese que definimos un segundo bloque de contenedores, en esos se
    // reemplazará la lista de opciones definida.
    let text = `
    <select class="old-select">
        ${options}
        <option value="default" selected>Selecciona el classroom</option>
    </select>

    <div class="new-select">
        <div class="selection">
            <p>
                <span></span>
                <i></i>
            </p>
            <span></span>
        </div>
    </div>
    `
    $(div).replaceWith(`<div>${text}</div>`); // Reemplazamos
    instanceSelect(); // Ejecutamos la instancia
};

function setWarnMessage(warnMsg) {
    //$("#warn-message").parent().parent().css("width", "auto")
    $("#warn-message").parent().css("border", "none")
    $("#warn-message").parent().css("margin-left", "8%")
    $("#warn-message").parent().css("margin-top", "-2.5%")
    $("#warn-message").replaceWith(`
    <div style="width: 27em;" class="warn-message-createq-presentation">
        <p>${warnMsg}</p>
    </div>`);
}

// esta vaina será pa la segunda entrega
/*
async function deleteSurvey(classroomId) {
    let res = await postInfo({
        task: "create_survey",
        data: entity
    });
};
async function deleteSurveyFromTeacher(classroomId) {
    let res = await postInfo({
        task: "create_survey",
        data: entity
    });
};
async function deleteSurveyFromStudent(classroomId) {
    let res = await postInfo({
        task: "create_survey",
        data: entity
    });
};
*/
