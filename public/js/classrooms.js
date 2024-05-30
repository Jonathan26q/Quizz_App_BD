const classroomCode = document.querySelector("#classroom_code");
const classroomName = document.querySelector('#classroom_name');
const classroomSection = document.querySelector('#classroom_section');
const classroomSubject = document.querySelector('#classroom_subject');
const classroomPlace = document.querySelector('#classroom_place');

const classroomBtnText = document.querySelector('#classroom_button_text');
const joinClassroomBtn = document.querySelector('#joinClassroomBtn');
const createClassroomBtn = document.querySelector('#createClassroomBtn');

classroomName.addEventListener('keyup', () => {
    createClassroomBtn.disabled = classroomName.value.length == 0;
});

classroomCode.addEventListener('keyup', () => {
    joinClassroomBtn.disabled = classroomCode.value.length == 0;
});

// Según la sesión se muestra un mensaje de boton (tambien cambiará la funcionalidad)
if (session.entityName == "teacher") { 
    $("#classroom_add_button").attr("href", "#divOne");
    classroomBtnText.innerHTML = "Crear classroom";

} else if (session.entityName == "student") {
    $("#classroom_add_button").attr("href", "#divTwo");
    classroomBtnText.innerHTML = "Unirse a classroom";
}

$(document).ready(function() { 
    instanceClassrooms(); // Cargamos y maquetamos los classrooms enlazados a la sesión
});

async function instanceClassrooms() {
    // Obtenemos los classrooms segun la sesión
    const res = await getInfo(`getClassroomsBy${capitalizeFirst(session.entityName)}Username?username=${session.username}`);  

    // Si no hay classrooms, notificamos.
    if (!res.data || res.status == 400) {
        $("#load_classrooms").replaceWith(`<div style="display: none"></div>`);
        if (res.status == 400) alert("Ha ocurrido un error al localizar la información, intente de nuevo más tarde.");
        return;
    }

    // Maquetamos
    const classrooms = JSON.parse(res.data);
    let txtClassrooms = "";
    classrooms.forEach(classroom => {
        txtClassrooms += loadClassroom(classroom)
    });

    // Reemplazamos
    $("#load_classrooms").replaceWith(txtClassrooms);
}

function loadClassroom(classroom) {
    return `
    <a class="pointer" onclick="redirectToClassroom(event, \'${classroom.classroomcode}\')">       
        <div class="classroom_button_area white-text">
            <div class="total-width">
                <img src="https://gstatic.com/classroom/themes/img_bookclub.jpg">                                                
            </div>
            <div class="classroom_name_area">
                <div class="classroom_name"><p>${classroom.classroomname}</p></div>
                <div class="classroom_section"><p>${classroom.classroomsection}</p></div>
            </div>
            <div class="folder-icon-area right">
                <i class="fa fa-folder-open"></i>
            </div>                    
        </div>
    </a>`
}

function redirectToClassroom(e, classroomCode) {
    e.preventDefault();

    // Al seleccionar un classroom, lo guardamos
    // de modo que en la vista de classroom.html,
    // se maqueten los datos del CLASSROOM SELECCIONADO
    localStorage.setItem("classroomSelected", classroomCode);
    window.location.assign("../html/classroom.html");
}

async function createClassroom(e) {
    e.preventDefault();    

    const classroomCode = await getInfo("getRandomClassroomCode"); 

    let entity = {
        classroomCode: classroomCode.data,
        classroomName: classroomName.value,
        classroomSection: classroomSection.value,
        classroomSubject: classroomSubject.value,
        classroomPlace: classroomPlace.value,
        teacherUsername: session.username,
        studentsUsernameList: "[]",
        totalStudents: 0
    }

    const res = await registerClassroom(entity);

    if (res.status == 400) return alert("El nombre de aula que ingresaste es invalido.");
    
    if (res.status == 200) {
        alert(`Creación satisfactoria del aula con el nombre ${classroomName.value}.`);

        // Al crear un classroom, redirigemos hacia la vista del CLASSROOM CREADO
        // por lo tanto, logicamente el CLASSROOM SELECCIONADO será el previamente creado.
        localStorage.setItem("classroomSelected", entity.classroomCode); 
        window.location.assign("../html/classroom.html");
    }
}

async function registerClassroom(entity) {
    const res = await postInfo({
        task: "create_classroom",
        data: entity
    });

    return res;
}

// Funcion para que los usuarios con rol de Estudiante, ingresen a su classroom
async function joinToClassroom(e) {
    e.preventDefault();

    const classroomObtained = await getInfo(`getClassroomByCode?code=${classroomCode.value}`);
    if (!classroomObtained.data) return alert("No existe un aula con este codigo.");        
    
    let studentAndCode = `${session.username}-${classroomCode.value}`
    const studentInsideClassroom = await getInfo(`validateClassroomRegistered?data=${studentAndCode}`);
    if (studentInsideClassroom.data) return alert("Ya te encuentras en aula con este codigo.");

    let entity = {
        classroomCode: classroomObtained.data.classroomcode,
        studentUsername: session.username
    }

    const res = await registerStudentToClassroom(entity);
    if (res.status == 400) return alert("Ha ocurrido un error al momento de unirse a esta aula.");

    if (res.status == 200) {
        alert(`Te has unido satisfactoriamente al aula.`);

        // Al unirse a un classroom, redirigemos hacia la vista del CLASSROOM INGRESADO
        // por lo tanto, logicamente el CLASSROOM SELECCIONADO será al que previamente se unio.
        localStorage.setItem("classroomSelected", classroomObtained.data.classroomcode);
        window.location.assign("../html/classroom.html");
    }
}

async function registerStudentToClassroom(entity) {
    const res = await postInfo({
        task: "register_student_classroom",
        data: entity
    });

    return res;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}