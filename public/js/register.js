const username = document.querySelector('#username');
const password = document.querySelector('#password');
const teacherSelector = document.querySelector("#teacher");
const studentSelector = document.querySelector("#student");
const saveUserBtn = document.querySelector("#saveUserBtn");

inputs = [username, password];
selectors = [studentSelector, teacherSelector];

for(let input of inputs) {
    input.addEventListener('keyup', () => {
        saveUserBtn.disabled = (input.value.length == 0 ? true : false) || !(teacherSelector.checked || studentSelector.checked);
    });
}

for(let selector of selectors) {
    selector.addEventListener('change', () => {
        saveUserBtn.disabled = username.value.length == 0 && password.value.length == 0;
    })
}

// Función para registrar usuarios nuevos
async function saveUser(e) {
    e.preventDefault();

    let entity = {
        username: username.value,
        password: password.value,
    }

    let res;
    if (teacherSelector.checked) res = await registerEntity(entity, "teachers");
    if (studentSelector.checked) res = await registerEntity(entity, "students");

    if (res.status == 400) return alert("Ya existe una cuenta con este nombre de usuario o el nombre que ingresaste es invalido.");

    // Se guarda la el nombre de usuario y el nombre de la entidad con la cual se identifico.
    let session = {
        entityName: teacherSelector.checked ? "teacher" : "student",
        username: entity.username,
    }; localStorage.setItem("session", JSON.stringify(session));

    alert(`Registro completado exitosamente para el usuario ${entity.username}`);
    window.location.assign("../index.html");
    
}

async function registerEntity(entity, entityName) {
    const res = await postInfo({
        task: "register",
        entity: entityName,
        data: {
            username: entity.username,
            password: entity.password
        }
    });

    return res;
}