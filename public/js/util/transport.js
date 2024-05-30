// Función para asegurar la importación de los datos en un JSON
tryGetJson = async (resp) => {
    return new Promise((resolve) => {
      if (resp) {
        resp.json().then(json => resolve(json)).catch(() => resolve(null))
      } else {
        resolve(null)
      }
    })
}

// Obtener info del backend al frontend
async function getInfo(query) {
    const res = await fetch((window.location.origin + "/" + "html/") + query, { method: 'GET' });
    const data = await tryGetJson(res);    
    return data;
}

// Exportar info del frontend al backend
async function postInfo(value) {
    if (!(value instanceof Object)) return;
    stringifyValue = JSON.stringify(value);

    const res = await fetch(window.location.origin + "/" + "html", { 
        method: 'POST', 
        headers: {
            "Content-Type": 'application/json'
        }, 
        body: JSON.stringify({
            parcel: stringifyValue
        })
    });

    return res;
}