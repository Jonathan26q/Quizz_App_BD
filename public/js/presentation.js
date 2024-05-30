const presentationField = document.querySelector('#userText');
const btnSite = document.querySelector('#btnSite');
const btnCreateClassroom = document.querySelector("#btnCreateClassroom");
const session = JSON.parse(localStorage.getItem("session")) || null
presentationField.innerHTML = `<p class="presentation-text white-text">${session ? "Bienvenido, "+session.username : "Por favor, inicia sesion o registrate"}</p>`;
let hasNotification = false;

$(document).ready(function() {
    verifySession(); // Verifica que la sesión actual sea valida
    setButtons(); // Instancia los botones según exista la sesión

    $('#classrooms-redirect').on('click', e => {redirect(e, "../html/classrooms.html")});
    $('#banks-redirect').on('click', e => {redirect(e, "../html/selectbank.html")});
    $('#surveys-redirect').on('click', e => {redirect(e, "../html/surveys.html", true)});
});

// Si la sesión actual es invalida, regresa a la vista index.html, esto
// con la intención de evitar problemas de direccionamiento
async function verifySession() {
    if (!session) return;
    const res = await getInfo(`getEntityName?username=${session.username}`);
    if (res.data) return;
    localStorage.removeItem("session");
    window.location.assign("../index.html");
};

function setButtons() {
    if (session) { // Boton de cerrar sesión si ya existe la sesión
        if (window.location.href.includes("index.html")) setNotificationStatus(hasNotification);
        return btnSite.innerHTML = `<a href="" id="" class="btn low-margin-right white-text btn-close-session" onclick="closeSession(event)">Cerrar sesión</a>`;
    }

    btnSite.innerHTML =  
    `<a href=".${btnSite.outerHTML.includes("index") ? "/html" : ""}/register.html" id="" class="btn low-margin-right">Registrarse</a>
    <a href=".${btnSite.outerHTML.includes("index") ? "/html" : ""}/login.html" id="" class="btn low-margin-right">Iniciar</a>`
};

function toggleNotification() {
    var detailDiv = document.getElementById('notification_detail');
    if (detailDiv.style.display === 'none' || detailDiv.style.display === '') {
        detailDiv.style.display = 'block';
        setNotificationStatus(hasNotification)
    } else {
        detailDiv.style.display = 'none';
    }
}

// Función para establecer la condición y hacer que el icono titile
async function setNotificationStatus(hasNotification) {
    var icon = document.getElementById('notification_icon');
    const text = document.getElementById('notificación_message');
    if (session) hasNotification = await isNotified();
    if (hasNotification) {
        text.innerHTML = "Tienes una nueva encuesta pendiente."
        icon.classList.add('blinking');
    } else {
        text.innerHTML = "No tienes encuestas pendientes."
        icon.classList.remove('blinking');
    }
}

async function isNotified() {
    const res = await getInfo(`getIsNotified?username=${session.username}`);
    if (!res.data) return false;
    return JSON.parse(res.data).getnotified == 1;
}

function closeSession(e) {
    e.preventDefault();
    localStorage.removeItem("session");
    window.location.assign("../index.html");
};

// Función para redirigir a los usuarios desde los botones del index.html a las respectivas vistas
function redirect(e, link, moveToSurveys) {
    e.preventDefault();
    if (!session) return alert("Por favor, registrate o inicia sesión antes de ingresar");

    // Si el usuario se redirige a las encuestas ocurre que en esta vista hay dos selectores, 
    // ambos cargan datos temporalmente al localStorage para hacer operaciones (ej: crear encuestas)
    // por lo que se opta por vaciar estos selectores cada vez que se ingresa a la vista de encuestas
    if (moveToSurveys) {
        localStorage.removeItem("classroomSelectionViewInput");
        localStorage.removeItem("classroomCreateSurvey");
    }

    window.location.assign(link);
}

    