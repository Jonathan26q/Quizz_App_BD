const username = document.querySelector('#username');
const password = document.querySelector('#password');
const saveUserBtn = document.querySelector("#logUserBtn");

inputs = [username, password];
for(let input of inputs) {
    input.addEventListener('keyup', () => {
        saveUserBtn.disabled = input.value.length == 0 ? true : false;
    });
}

// Función para verificar y guardar la sesión de usuarios que ingresan.
async function logUser(e) {
    e.preventDefault();

    let entity = {
        username: username.value,
        password: password.value
    }

    let res = await postInfo({
        task: "login",
        data: {
            username: entity.username,
            password: entity.password
        }
    });

    if (res.status == 400) return alert("Esta cuenta no se encuentra en la base de datos.");
    
    // Del usuario que ingresa, obtenemos si se trata de un estudiante o de un profesor
    res = await getInfo(`getEntityName?username=${entity.username}`);
    if (!res.data) return alert("Ha ocurrido un error al momento de obtener el nombre de la entidad, intente de nuevo más tarde.");
    
    // Se guarda la sesión, el nombre de usuario y el nombre de la entidad (student/teacher)
    let session = {
        entityName: res.data,
        username: entity.username
    }; localStorage.setItem("session", JSON.stringify(session));
                
    alert("Inicio de sesión completado."); 
    window.location.assign("../index.html");
}