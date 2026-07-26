//Menu de barras (movil)
function menuBarras(){
    const iconoBarras = document.querySelector(".icono-barras");
    const navegacion = document.querySelector(".navegacion-principal");
    if (!iconoBarras || !navegacion) return;
    iconoBarras.addEventListener("click", (e) =>{
        navegacion.classList.toggle("activo");
    })
}
menuBarras();

//Conexion a los formularios

//form de login
const formLogin = document.getElementById("formLogin");
if(formLogin){
    formLogin.addEventListener("submit", async(e) => {
        e.preventDefault();
        const correo = document.getElementById("correo").value;
        const password = document.getElementById("password").value;
        const errorMsg = formLogin.querySelector(".error");

        try{
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    correo,
                    password
                })
            });
            const data = await res.json();

            if(res.ok){
                window.location.href = "dashboard.html";
            }else{
                errorMsg.textContent = data.error;
                errorMsg.classList.remove("hidden");
            }
        }catch(error){
            console.log(error);
        }
    });
}

const formRegistro = document.getElementById("formRegistro");
if(formRegistro){
    formRegistro.addEventListener("submit", async(e) => {
        e.preventDefault();
        const nombre = document.getElementById("nombre").value;
        const apellidos = document.getElementById("apellidos").value;
        const usuario = document.getElementById("usuario").value;
        const correo = document.getElementById("correo").value;
        const password = document.getElementById("password").value;
        const errorMsg = formRegistro.querySelector(".error");
        try{
            const res = await fetch("api/registro", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({nombre, apellidos, usuario, correo, password})
            });
            const data = await res.json();
            if(res.ok){
                alert("Cuenta creada!, ahora puedes iniciar sesión en el sistema");
                window.location.href = "login.html";
            }else{
                errorMsg.textContent = data.error;
                errorMsg.classList.remove("hidden");
            }
        }catch(error){
            console.log(error);
        }

    });

}

//cerrar la sesion
const btnSalir = document.querySelector(".opcion-nav-principal-salir");
if(btnSalir){
    btnSalir.addEventListener("click", async () => {
        try{
            await fetch("/api/logout", {method: "POST"});
            window.location.href = "login.html";
        }catch(error){
            console.log(error);
        }
    });
}

//mostrar datos en la interfaz del dashboard
const saludoUsuario = document.getElementById("saludoUsuario");
if(saludoUsuario){
    cargarDashboard();
}

async function cargarDashboard() {
    try{
        const res = await fetch("/api/dashboard");

        //si es que no hay una sesion activa, mandamos al loginn
        if(res.status === 401){
            window.location.href ="login.html";
            return;
        }
        const data = await res.json();

        //saludo de bienvenida y fecha
        document.getElementById("saludoUsuario").textContent = `¡Bienvenido(a), ${data.usuario.nombre}!`;
        document.getElementById("fechaActual").textContent = data.fecha.charAt(0).toUpperCase() + data.fecha.slice(1);

        //cargar info de las cards
        document.getElementById("numCitasHoy").textContent = data.metricas.citasHoyContador;
        document.getElementById("numAnimales").textContent = data.metricas.totalAnimales;
        document.getElementById("numEnTratamiento").textContent = data.metricas.enTratamiento;
        document.getElementById("numPropietarios").textContent = data.metricas.totalPropietarios;

        //para mostrar las citas de hoy
        const listaCitasHoy = document.getElementById("listaCitasHoy");
        if(data.citasHoy.length === 0){
            listaCitasHoy.innerHTML = 
                `<div class="contenedor-fila"><p class="fila-cita-hoy">No hay citas para hoy</p></div>`;
        }else{
            listaCitasHoy.innerHTML = data.citasHoy.map(cita => `
                <div class="contenedor-fila contenedor-fila-cita-hoy">
                    <p class="fila-cita-hoy">${cita.hora}</p>
                    <p class="fila-cita-hoy">${cita.animal} - ${cita.motivo || "Consulta"}</p>
                    <p class="estado-fila estado-fila-cita-hoy-${cita.estado === "confirmada" ? "confirmada" : cita.estado === "cancelada" ? "cancelada" : "pendiente"}">
                        ${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                    </p>
                </div>
            `).join("");
        }

        //notificaciones
        const listaNotificaciones = document.getElementById("listaNotificaciones");
        if (data.notificaciones.length === 0) {
            listaNotificaciones.innerHTML = `<div class="contenedor-fila"><p class="fila-notificacion">Sin notificaciones</p></div>`;
        } else {
            listaNotificaciones.innerHTML = data.notificaciones.map(n => `
                <div class="contenedor-fila contenedor-fila-notificacion">
                    <p class="fila-notificacion">${n.hora}</p>
                    <p class="fila-notificacion">${n.animal} - ${n.motivo || "Consulta"}</p>
                </div>
            `).join("");
        }

    }catch(error){
        console.log(error);
    }
}