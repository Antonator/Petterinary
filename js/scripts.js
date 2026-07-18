function menuBarras(){
    const iconoBarras = document.querySelector(".icono-barras");
    const navegacion = document.querySelector(".navegacion-principal");
    iconoBarras.addEventListener("click", (e) =>{
        navegacion.classList.toggle("activo");
    })
}

menuBarras();