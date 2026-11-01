"use strict";

// Etapa 1: estructura visual y estado inicial.
// La gestión de tareas se incorporará en la siguiente etapa.

const elementos = {
  formulario: document.getElementById("formulario"),
  conexion: document.getElementById("conexion"),
  mensaje: document.getElementById("mensaje"),
  lista: document.getElementById("lista")
};

function actualizarConexion() {
  elementos.conexion.textContent = navigator.onLine
    ? "Estado de red: conexión disponible."
    : "Estado de red: sin conexión.";
}

elementos.formulario.addEventListener("submit", evento => {
  evento.preventDefault();

  elementos.mensaje.textContent =
    "La interfaz está preparada. " +
    "La gestión de tareas se implementará en la siguiente etapa.";
});

const avisoInicial = document.createElement("li");

avisoInicial.textContent =
  "Todavía no hay tareas cargadas en esta etapa.";

elementos.lista.append(avisoInicial);

window.addEventListener("online", actualizarConexion);
window.addEventListener("offline", actualizarConexion);

actualizarConexion();