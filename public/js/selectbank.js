$(document).ready(function() { 
    localStorage.setItem("classroomBankSelectionViewInput", 0); // Al momento de iniciar la vista, no se ha seleccionado ningun banco
    setClassroomsDropdown(); // Maqueta el selector de classrooms para acceder al banco privado correspondiente
});


async function setClassroomsDropdown() {
    let res;

    // Segun la sesión, obtiene los classrooms enlazados a la cuenta de una forma u otra (Revisar modelo de datos).
    if (session.entityName == "teacher") {
        res = await getInfo(`getClassroomsByTeacherUsername?username=${session.username}`);
    } else if (session.entityName == "student") {
        res = await getInfo(`getClassroomsByStudentUsername?username=${session.username}`);
    }

    let anyClassrooms = JSON.parse(res.data);
    if (!anyClassrooms) return; // Si no hay classrooms, no hay nada que seleccionar

    let options = "";
    for(let classroom of anyClassrooms) {
        let v = `${classroom.classroomname}-${classroom.classroomcode}`;
        // El ^ en id="${v}^" es importante porque el evento de seleccionar un elemento del selector,
        // carga hasta dos variables de localStorage, entonces con el ^ diferenciamos que se trata
        // del selector de banco, (revisar dropdown.js)
        options += `<li class="option-text" id="${v}^">${v}</li>`
    }

    // Maqueta el selector
    setPrivateBank(options);
}

function setPrivateBank(options) {
    let txt = `<div><a class="pointer" onclick="redirectToBank(event, 'private')">       
        <div class="classroom_button_area white-text">
            <div class="total-width">
                <img src="https://www.gstatic.com/classroom/themes/Honors.jpg">                                                
            </div>
            <div class="classroom_name_area">
                <div class="classroom_name"><p>Privado</p></div>
                <div class="classroom_section"><p>Preguntas unicas de un classroom</p></div>
            </div>
            <div class="dropdown" style="margin-top: 1%; margin-left: 15%; width: 70%; height: auto">
                <div class="select">
                    <span>¿Classroom?</span>
                    <i class="fa fa-chevron-left"></i>
                </div>
                <input type="hidden" name="gender">
                <ul class="dropdown-menu">
                    ${options}
                </ul>
            </div>                         
        </div>
    </a></div>`

    $("#private-bank").replaceWith(txt);
    instanceDropdown(); // Carga las opciones maquetadas en el selector
}

// Redirige al banco seleccionado
function redirectToBank(e, bankType) {
    e.preventDefault();

    // Si es publico, solo le recordaremos a la vista que esta dentro de un banco publico y redirigimos
    if (bankType == "public") {
        localStorage.setItem("bankType", bankType);
        localStorage.setItem("classroomBankSelectionViewInput", 1);
        window.location.assign("../html/createquestion.html");
        return;
    }

    // Si el banco es privado, primero verificamos que haya seleccionado un classroom, y luego redirimos.
    let selectedClassroom = localStorage.getItem("classroomBankSelectionViewInput", 0);
    if (selectedClassroom == 0) return alert("Por favor, seleccionar un classroom antes de ingresar al banco privado.");

    if (bankType == "private") {
        localStorage.setItem("bankType", bankType);
        if (localStorage.getItem("classroomBankSelectionViewInput") != 0) window.location.assign("../html/createquestion.html");
        else return alert("Selecciona un classroom antes de ingresar al banco privado.");
    }
}