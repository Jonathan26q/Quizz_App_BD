const choices = Array.from(document.querySelectorAll('.choice-text'));
const progressText = document.querySelector('#progressText');
const progressBarFull = document.querySelector('#progressBarFull');
const scoreText = document.querySelector('#score');
const loadChoicesArea = document.querySelector("#load-choices");
const titleTextImageArea = document.querySelector("#option-text-image");

let surveyDataSaved = null;
let dataScoreSave = [];

let imageOpening = false;
let availableQuestions = [];
let currentQuestion = null;
let questionCounter = 0;
let score = 0;
let blanks = [];
let validsGoing = 0;
let acceptingAnswers = true;

let totalMiliseconds = null;

const SCORE_POINTS = 100;
let MAX_QUESTIONS;

let startMomentDate = null

// Al ingresar por primera vez a la vista, se despliega el quiz
function startQuestionary() {
    startMomentDate = new Date();
    
    questionCounter = 0;
    score = 0;

    // Se obtienen las preguntas cargadas anteriormente en la vista de surveys (encuestas)
    let questions = JSON.parse(localStorage.getItem("quizQuestions")) || null;
    surveyDataSaved = JSON.parse(localStorage.getItem("surveyDataSaved"));
    totalMiliseconds = localStorage.getItem("totalMiliseconds");

    if (!totalMiliseconds) {
        const minutesToAnswerTotalQuestions = surveyDataSaved.timesurvey;
        totalMiliseconds = minutesToAnswerTotalQuestions * 60 * 1000;
        localStorage.setItem("totalMiliseconds", totalMiliseconds);
    }
    totalMiliseconds = parseInt(totalMiliseconds);

    MAX_QUESTIONS = questions.length;

    availableQuestions = [...questions];    
    
    const currentDateTime = new Date().toLocaleString();
    localStorage.setItem('currentDateTime', currentDateTime);

    startRunningTimer();
    getNewQuestion();
}

function startRunningTimer() {
    const time = document.querySelector('#time');
    time.innerText = '00:00';
    
    setInterval(() => {
        let minutesLeft = Math.floor(totalMiliseconds / 60 / 1000);
        let secondsLeft = Math.floor(totalMiliseconds / 1000) % 60;

        if (minutesLeft < 10) minutesLeft = `0${minutesLeft}`;
        if (secondsLeft < 10) secondsLeft = `0${secondsLeft}`;

        time.innerText = `${minutesLeft}:${secondsLeft}`;

        totalMiliseconds -= 1000;
        localStorage.setItem("totalMiliseconds", totalMiliseconds);

        if (totalMiliseconds <= 0) {
            alert("El tiempo de la encuesta ha pasado, no puedes responder más preguntas.");
            localStorage.setItem('dataScoreSave', JSON.stringify(dataScoreSave));
            localStorage.setItem('scoreData', JSON.stringify({score, maxScore: MAX_QUESTIONS}));
            localStorage.setItem('totalMiliseconds', null);
            return window.location.assign('../html/end.html');
        }
    }, 1000);
}

// Función para obtener una nueva pregunta en cada ciclo.
getNewQuestion = () => { 
    // Si no hay preguntas disponibles o ya se ha dado respuesta a todas, se va a la vista final.
    if(availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS) {
        localStorage.setItem('dataScoreSave', JSON.stringify(dataScoreSave));
        localStorage.setItem('scoreData', JSON.stringify({score, maxScore: MAX_QUESTIONS}));
        localStorage.setItem('totalMiliseconds', null);
        return window.location.assign('../html/end.html');
    }
    
    questionCounter++;
    progressText.innerText = `Pregunta ${questionCounter} de ${MAX_QUESTIONS}`;
    progressBarFull.style.width = `${(questionCounter/MAX_QUESTIONS) * 100}%`;

    // De las preguntas disponibles (que ya estaban cargadas al azar)
    // se vuelven a sortear cada vez que se responde una pregunta
    const qIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[qIndex];

    // Maqueta la pregunta seleccionada
    setQuestion(currentQuestion, qIndex); 
}

// Maqueta la pregunta seleccionada
function setQuestion(currentQuestion, questionsIndex) {
    let title_area = "", txt = "";
    let dataNumberCounter = 0;
    const options = JSON.parse(currentQuestion.options);
        
    const MAX_QUIZ_QUESTION_TITLE_LENGTH = 125; // Maximo texto a mostrar en la presentación del ENUNCIADO DE LA PREGUNTA
    // Maqueta
    title_area = `
        <div style="margin-top: 5%; margin-left: 5%; margin-right: 5%;">
            <div style="margin-bottom: 5%;">
                <h1 id="question" class="white-text">${formatText(currentQuestion.title, MAX_QUIZ_QUESTION_TITLE_LENGTH)}</h1>
                ${currentQuestion.title.length > MAX_QUIZ_QUESTION_TITLE_LENGTH ? `<a style="width: 10em; color: aqua; font-size: 1.5em;" class="link-reference white-text" onclick="openFullText(event, '${currentQuestion.title}')">Ver más</a>` : ""}            
            </div>
            ${currentQuestion.url && currentQuestion.url.length == 0 || !isValidUrl(currentQuestion.url) ? "" : `<a style="width: 10em;" class="pointer btn btn-save-classroom" onclick="openImage(event, '${currentQuestion.url}')">Ver imagen <i class="fas fa-location-arrow"></i></a>`}
        </div>
    `;

    // Reemplaza
    titleTextImageArea.innerHTML = title_area;

    if (currentQuestion.questiontype == "Subir un link") {
        let questionHTML = renderUploadLinkQuestion(questionsIndex); 
        txt += questionHTML;
    }

    // Maqueta las opciones y reemplaza
    for(const option of options) {
        const IS_VALID_URL = option.url && option.url.length != 0 && isValidUrl(option.url);

        // Si hay una URL valida, va a haber un boton a la derecha, si no hay URL valida
        // ese boton no aparecera entonces aprovechamos ese espacio para expander el limite
        // de texto que se puede mostrar en las opcioness 
        const MAX_QUIZ_OPTION_TITLE_LENGTH = IS_VALID_URL ? 20 : 35; 

        if (currentQuestion.questiontype == "Llena los espacios") {
            let questionHTML = renderFillInTheBlankQuestion(option, questionsIndex); 
            txt += questionHTML;

            setTimeout(() => {
                sendButtonEvent(questionsIndex);
            }, 1000);
        } else {
            // Maquetamos
            txt += `
            <div onclick="checkAnswers(event, \'#choice-container-${dataNumberCounter}\', ${option.valid}, ${questionsIndex})" id="choice-container-${dataNumberCounter}" class="choice-container">                    
                <div class="flex left">
                    <p class="choice-prefix">${dataNumberCounter + 1}</p>
                    <p class="choice-text" data-number="${dataNumberCounter}">${formatText(option.title, MAX_QUIZ_OPTION_TITLE_LENGTH)}
                    ${option.title.length > MAX_QUIZ_OPTION_TITLE_LENGTH ? `<a class="link-option-reference align pointer white-text" onclick="openFullText(event, '${option.title}')">Ver más</a>` : ""}
                    </p>
                </div>
                ${!IS_VALID_URL ? "" : `
                <div class="flex right align" style="margin-right: 2%;" onclick="openImage(event, '${option.url}')">
                    <a class="btn btn-save-classroom" style="font-size: 0.7em; height: 1em; width: 9em;" href="#divOne">Ver imagen <i class="fas fa-location-arrow"></i></a>
                </div>`
                }
            </div>`

            // Reemplazamos
            dataNumberCounter = dataNumberCounter + 1;
        }
    };

    loadChoicesArea.innerHTML = txt;
    acceptingAnswers = true;
}

function checkAnswers(e, containerId, isValid, questionIndex) {
    e.preventDefault();

    const minutesPassed = howMuchMinutes();
    if (minutesPassed > surveyDataSaved.timeSurvey) {
        alert("El tiempo de la encuesta ha pasado, no puedes responder más preguntas.");
        localStorage.setItem('dataScoreSave', JSON.stringify(dataScoreSave));
        localStorage.setItem('scoreData', JSON.stringify({score, maxScore: MAX_QUESTIONS}));
        localStorage.setItem('totalMiliseconds', null);
        return window.location.assign('../html/end.html');
    }

    // Se evita el caso en el que se intento respondar a otra opción en medio del cambio entre preguntas
    if (!acceptingAnswers) return; 
    acceptingAnswers = false;

    if (currentQuestion.questiontype == "Eleccion multiple") {
        validateMultipleChoice(containerId, isValid, questionIndex);
        validsGoing = 0;
    } else {
        // Logica para validar pregunta de tipo unica

        // Valida si la respuesta es correcta, si es así, notifica e incrementa los puntos
        isValidAnswer(isValid, containerId, true);
        saveResponseData(currentQuestion);
        // Elimina la pregunta respuesta de las disponibles, y lanza una nueva pregunta.
        if (isValid) moveToNextQuestion(containerId, questionIndex);
    }
}

function howMuchMinutes() {
    const storedDateTime = localStorage.getItem('currentDateTime');

    // Verificar si storedDateTime es una cadena válida
    if (!storedDateTime || storedDateTime.trim() === '') {
        console.log('No hay una fecha y hora almacenadas en localStorage');
        return -1; // Devolver -1 para indicar un error
    }

    const storedDate = getDate(storedDateTime);
    const currentDate = new Date();

    const diffInMs = currentDate.getTime() - storedDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    return diffInMinutes;
}

function getDate(storedDateTime) {
    const dateTimeComponents = storedDateTime.split(/[\s,]+/); // Dividir por espacios o comas
    const dateComponents = dateTimeComponents[0].split('/'); // Separar la fecha por "/"
    const timeComponents = dateTimeComponents[1].split(':'); // Separar la hora por ":"

    // Crear un nuevo objeto Date con los componentes de fecha y hora
    const storedDate = new Date(
        parseInt(dateComponents[2]),  // Año
        parseInt(dateComponents[1]) - 1,  // Mes (restar 1 porque los meses en JavaScript van de 0 a 11)
        parseInt(dateComponents[0]),  // Día
        parseInt(timeComponents[0]),  // Hora
        parseInt(timeComponents[1]),  // Minutos
        parseInt(timeComponents[2])   // Segundos
    );

    return storedDate;
}

function validateMultipleChoice(containerId, isValid, questionIndex) {
    isValidAnswer(isValid, containerId, false);
    
    const quantityOfValids = checkQuantityOfValids(JSON.parse(currentQuestion.options));
    if (quantityOfValids == validsGoing) {
        incrementScore(SCORE_POINTS);

        saveResponseData(currentQuestion);
        moveToNextQuestion(containerId, questionIndex);
    } else if (isValid) {
        alert("Todavia quedan opciones válidas");
        acceptingAnswers = true;
    }
}

function saveResponseData() {
    const ogTime = localStorage.getItem('currentDateTime');
    const timeNow = new Date().toLocaleString();
    dataScoreSave.push({ 
        currentQuestion: currentQuestion.title, 
        ogTime: ogTime, 
        time: timeNow, 
        score: score, 
        maxScore: MAX_QUESTIONS * 100,
        minutesPassed: howMuchMinutes(),
        umbral: surveyDataSaved.umbral, 
        percent: surveyDataSaved.percent 
    });
    acceptingAnswers = true;
}

function isValidAnswer(isValid, containerId, doIncrementScore) {
    if (isValid) {
        if (doIncrementScore) incrementScore(SCORE_POINTS);
        $(containerId).css("background", "linear-gradient(32deg, rgba(11, 223, 36) 0%, rgb(41, 232, 111) 100%)");
        validsGoing++;
    } else {
        $(containerId).css("background", "linear-gradient(32deg, rgba(230, 29, 29, 1) 0%, rgb(224, 11, 11, 1) 100%)");
        moveToNextQuestion();
    }
}

function moveToNextQuestion(containerId, questionIndex) {
    setTimeout(() => {
        $(containerId).css("background", "rgb(80, 125, 221)");
        availableQuestions = availableQuestions.filter((_, index) => index != questionIndex);
        getNewQuestion();
    }, 1000);
}

function checkQuantityOfValids(options) {
    let quantityOfValids = 0;
    for (const option of options) {
        if (option.valid) quantityOfValids++;
    }
    return quantityOfValids;
}

function renderUploadLinkQuestion(questionsIndex) {
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.alignItems = 'center';

    const linkInput = document.createElement('input');
    linkInput.type = 'text';
    linkInput.placeholder = 'Ingresa el enlace aquí';
    linkInput.id = `question-${questionsIndex}-input`;
    linkInput.style.flexGrow = '1';
    linkInput.style.padding = '8px';
    linkInput.style.fontSize = '16px';

    const submitButton = document.createElement('button');
    submitButton.classList.add('question-submit-button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Enviar';
    submitButton.style.marginLeft = '8px';
    submitButton.style.marginBottom = '8px';
    submitButton.style.padding = '8px 16px';
    submitButton.style.fontSize = '16px';

    inputContainer.appendChild(linkInput);
    inputContainer.appendChild(submitButton);

    return inputContainer.outerHTML;
}

function sendButtonEvent(questionsIndex) {
    const submitButton = document.querySelector('.question-submit-button');
    submitButton.addEventListener('click', () => {        
        const linkInput = document.getElementById(`question-${questionsIndex}-input`);
        const inputValue = linkInput.value.trim();

        if (inputValue) {
            incrementScore(SCORE_POINTS);
            availableQuestions = availableQuestions.filter((_, index) => index != questionsIndex);
            getNewQuestion();

            postInfo({
                task: "save_links",
                data: { username: session.username, inputValue }
            });
        } else {
            alert('Por favor, ingresa un enlace válido.');
        }
    });
}

function renderFillInTheBlankQuestion(option, questionIndex) {
    const questionText = option.title;
    blanks = [];
    let questionHTML = '';
    let lastIndex = 0;

    const blankRegex = /%(.+?)%/g;

    let match;
    while ((match = blankRegex.exec(questionText)) !== null) {
        const blankWord = match[1];
        const startIndex = match.index;

        questionHTML += questionText.slice(lastIndex, startIndex);
        questionHTML += `<input type="text" style="width: auto; padding: 0px;" class="blank-input" data-blank-index="${blanks.length}" onkeyup="checkAllBlanksFilledIn(this, event, ${questionIndex})">`;
        blanks.push(blankWord);

        lastIndex = startIndex + match[0].length;
    }

    questionHTML += questionText.slice(lastIndex);

    return questionHTML
}

function checkAllBlanksFilledIn(input, event, questionIndex) {
    const blanksInputs = document.querySelectorAll('.blank-input');
    const allBlanksCorrect = Array.from(blanksInputs).every((blankInput, index) => {
        const expectedWord = blanks[index];
        const inputValue = blankInput.value.trim();
        return inputValue === expectedWord;
    });

    if (allBlanksCorrect) {
        incrementScore(SCORE_POINTS);
        availableQuestions = availableQuestions.filter((_, index) => index != questionIndex);
        acceptingAnswers = true;
        getNewQuestion();
    }
}

// Función para abrir una imagen completa en una vista
function openImage(e, url) {
    e.preventDefault();

    $("#title-image").attr("src", url);
    window.location.assign("#divOne");

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}

// Función para abrir el texto completo en una vista (se trata de una opción
// que solo se presenta cuando el texto supera un limite de caracteres)
function openFullText(e, fullText) {
    e.preventDefault();

    $("#option-text").html(fullText);
    window.location.assign("#divTwo");

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}

function incrementScore(num) {
    score +=num
    scoreText.innerText = score
}

formatText = (string, length) => {
    if (string.length > length)
        return string.substring(0,length)+'...';
    else
        return string;
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

startQuestionary();
