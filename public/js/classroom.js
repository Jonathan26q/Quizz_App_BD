const classroomCodeText = document.querySelector("#classroom_code_text");
const classroomNameText = document.querySelector("#classroom_name");
const classroomSectionText = document.querySelector("#classroom_section");
const classroomPresentationText = document.querySelector('#classroom-presentation-text');
const chart = document.querySelector("#chart");

let scoreList = [];

// Segun la sesión mostramos un mensaje de encabezado
if (session.entityName == "teacher") {
    classroomPresentationText.innerHTML = "Lista de estudiantes"
} else if (session.entityName == "student") {
    classroomPresentationText.innerHTML = "Classroom"
}

const classroomSelectedCode = localStorage.getItem("classroomSelected") || null;
if (!classroomSelectedCode) { // Si accede aca sin seleccionar un classroom, no es posible operar, regresa a la vista anterior
    window.location.assign("../html/classrooms.html");
};

$(document).ready(function() { 
    getClassroom(); // Según el classroom seleccionado, completa la información de la ficha.
    
    // Segun la sesion, mostramos una vista dependiente del classroom
    if (session.entityName == "teacher") instanceTeacherClassroomView(); else
    if (session.entityName == "student") instanceStudentClassroomView();   
});

async function instanceTeacherClassroomView() {
    // Si la sesion es del profesor, mostraremos la lista de estudiantes segun el classroom seleccionado
    const res = await getInfo(`getStudentsByClassroomCode?code=${classroomSelectedCode}`);
    const studentList = JSON.parse(res.data);

    // Si no hay estudiantes, notificamos
    if (!studentList || studentList.length == 0) {
        txt = `
        <div style="margin-top:1%;" class="warn-message-presentation">
            <p>No existen estudiantes registrados en esta aula</p>
        </div>`

        return $("#load-classroom-data").replaceWith(txt);
    }

    // Si hay al menos un estudiante, maqueta sus datos
    let txtStudents = "";
    studentList.forEach(username => {
        txtStudents += loadStudentView(username);
    });

    // Reemplaza
    $("#load-classroom-data").replaceWith(txtStudents);
}

function loadStudentView(username) {
    return `<div onclick="redirectToStudentInfo(event, \'${username}\')" style="margin-top: 1%;margin-left: 3%;" class="pointer question-presentation flex">
        <div class="questions-text-button total-height">
            <div class="flex">
                <i style="font-size: 3em; color: rgb(15, 87, 155);" class="fas fa-user"></i>
                <p style="margin-left: 1em;" class="question-title">${username}</p>
            </div>
        </div>

        <div onclick="deleteStudent(event, \'${username}\', \'${classroomSelectedCode}\')" class="delete-question-button align center right">
            <i class="fas fa-bomb"></i>
        </div>
    </div>`;
}

async function instanceStudentClassroomView() {
    // Si la sesion es del estudiante, muestra sus resultados de encuestas realizadas para el classroom seleccionado
    let res = await getInfo(`getScoresByUsername?username=${session.username}`);
    const scoreList = JSON.parse(res.data);
    let txt = "";
    
    // Si no hay calificaciones en este classroom, notifica.
    if (!scoreList || scoreList.length == 0) {
        txt = `
        <div style="margin-top: 0.5%; margin-bottom: 3%" class="warn-message-presentation">
            <p>No existen resultados de encuestas para este usuario</p>
        </div>`

        return $("#load-classroom-data").replaceWith(txt);
    }

    // Si hay al menos un puntaje, obtiene su encuesta y classroom correspondiente, 
    // si coincide con el classroom seleccionado, entonces maqueta.
    
    for(const scoreData of scoreList) {
        res = await getInfo(`getSurveyBySurveyCode?code=${scoreData.surveyid}`);                
        const survey = res.data;

        if (survey.classroomId == classroomSelectedCode)
            txt += `<div class="survey-results-presentation">
                <p style="padding: 15px">${survey.surveytitle}</p>
                <p style="margin-left: 15px; margin-bottom: 15px; margin-right: 15px">${scoreData.score} / ${scoreData.maxscore}</p>
            </div>`;
    }

    txtScores = loadStudentScores(txt); // Maqueta

    // Reemplaza
    $("#load-classroom-data").replaceWith(txtScores);
}

function loadStudentScores(scores) {
    return `
    <div style="margin-top: 1%;margin-left: 3%;height: auto" class="question-presentation flex">
        <div class="questions-text-button total-height">
            <div class="flex">
                <i style="font-size: 3em; color: rgb(15, 87, 155);" class="fas fa-user"></i>
                <p style="margin-left: 1em;" class="question-title">${session.username}</p>
            </div>
            <div class="survey-results-area">
                ${scores}
            </div>
        </div>
    </div>`;
}

// Los estudiantes borrados, se borran del classroom y sus relacionados
async function deleteStudent(e, username, classroomCode) {
    e.preventDefault();

    // Para evitar la propagación de eventos, ya que usamos botones anidados
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();

    let res = await postInfo({
        task: "delete_classroom_student",
        data: {
            username, classroomCode 
        }
    });

    if (res.status == 400) return alert("No ha sido posible eliminar el estudiante, intente de nuevo más tarde.");
    
    if (res.status == 200) {
        alert("Estudiante eliminado satisfactoriamente.");
        window.location.assign("../html/classroom.html");
    }
}

// Función para copiar texto al portapapeles
function copyClipboard(e, txt) {
    e.preventDefault();

    // Pequeña animación para notificar al usuario de la acción
    $("#clipboardBtn").css("color", "#ffac00");
    setTimeout(() => {
        $("#clipboardBtn").css("color", "#fff");
    }, 1000);

    // Copiar al portapapeles
    navigator.clipboard.writeText(txt);
}

// Función para maquetar la ficha del classroom
async function getClassroom() {
    const classroomObtained = await getInfo(`getClassroomByCode?code=${classroomSelectedCode}`);
    if (!classroomObtained.data) return window.location.assign("../html/classrooms.html");
    
    // La información del classroom seleccionado la completa en una ficha.
    classroomCodeText.innerHTML = `
    <div class="flex">
        <p>Codigo: ${classroomObtained.data.classroomcode}</p>

        <div onclick="copyClipboard(event, \'${classroomObtained.data.classroomcode}\')">
            <a style="width: 1em;height: 0.5em;margin-left:1em; cursor:pointer">
                <i id="clipboardBtn" class="white-text fas fa-copy"></i>
            </a>
        </div>
    </div>`;

    // Reemplaza
    classroomNameText.innerHTML = `<p>${classroomObtained.data.classroomname}</p>`;
    classroomSectionText.innerHTML = classroomObtained.data.classroomsection;

    classroom = classroomObtained.data;
}

// Función para construir un grafico, usada en la vista desde la sesion de profesor,
// para representar los puntajes historicos de cada usuario.
async function instanceChart(username) {
    let res = await getInfo(`getScoresByUsername?username=${username}`);
    scoreList = JSON.parse(res.data) || [];
    console.log(scoreList);
    // Igual que en la función getClassroom, buscamos los resultados
    // que coincidan con el classroom seleccionado.

    let results = [];
    for(let scoreData of scoreList) {
        res = await getInfo(`getSurveyBySurveyCode?code=${scoreData.surveyid}`)
        const survey = res.data;
        if (survey.classroomid == classroomSelectedCode)
            results.push([`${survey.surveytitle}-${scoreData.surveyid}`, scoreData.score]);
    }

    var chart = anychart.column(results); // Declaracion
    chart.title("Resultados por encuesta");
    chart.yScale().ticks().interval(100); // Imagenes de 100 en 100
    chart.container("chart").draw(); // Dibujar grafica

    res = await getInfo(`getLinksByUsername?username=${username}`);
    let links = JSON.parse(res.data).answers;
    links = JSON.parse(links);

    let txtLinks = `<div style="margin-top: 10px;">Links subidos por el estudiante:</div><br>`;
    for(let link of links) {
        txtLinks += link + "<br>";
    }
    if (links.length > 0) $("#links").replaceWith(txtLinks);

    window.location.assign("#divOne"); // Mostrar vista
}

$("#download-all-reports").click(async function() {
    const res = await getInfo(`getScoresByClassroomCode?code=${classroomSelectedCode}`);
    const surveys = JSON.parse(res.data);
    console.log(surveys);
  
    const dataCSV = [
      ['studentusername', 'surveyid', 'score', 'maxscore', 'va aprobando'],
      ...surveys.flatMap(survey => survey.map(student => {
        const { studentusername, surveyid, score, maxscore, data } = student;
        const approved = data.some(question => question.score >= question.umbral);
        return [studentusername, surveyid, score, maxscore, approved ? 'aprueba' : 'falla'];
      }))
    ];
  
    downloadCSV(dataCSV);
  });

//cuando se clickee en el boton de descargar reporte
$("#download-reports").click(function() { 
    fillData();
});


function fillData() {
    let dataCSV = [
        ['Pregunta actual', 'Puntaje', 'Maximo puntaje', 'Minutos hasta aca', 'Tiempo hasta ese punto', 'Tiempo inicio', 'Umbral', 'Porcentaje']
    ];

    for(let scoreData of scoreList) {
        for(const data of scoreData.data) {
            dataCSV.push([
                data.currentQuestion.replaceAll('-', ' ').replaceAll('_', ' ').replaceAll(',', ' '),
                data.score,
                data.maxScore,
                data.minutesPassed,
                data.time.replaceAll(',', '.'),
                data.ogTime.replaceAll(',', '.'),
                data.umbral,
                data.percent
            ]);
        }
    }

    downloadCSV(dataCSV);
}

function downloadCSV(dataCSV) {
    const csvContent = dataCSV.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = 'datos.csv';
  
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

function redirectToStudentInfo(e, username) {
    e.preventDefault();
    console.log(username);
    chart.innerHTML = "";
    instanceChart(username);
}