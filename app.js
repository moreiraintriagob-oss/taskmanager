"use strict";

// ETAPA 2
// Gestión CRUD, validación y persistencia local.

const CLAVE = "taskmanager.v2";

const elementos = {
  formulario: document.getElementById("formulario"),
  tituloFormulario: document.getElementById("titulo-formulario"),
  titulo: document.getElementById("titulo"),
  prioridad: document.getElementById("prioridad"),
  guardar: document.getElementById("guardar"),
  cancelar: document.getElementById("cancelar"),
  conexion: document.getElementById("conexion"),
  mensaje: document.getElementById("mensaje"),
  lista: document.getElementById("lista"),
  total: document.getElementById("total"),
  pendientes: document.getElementById("pendientes"),
  completadas: document.getElementById("completadas")
};

let tareas = [];
let idEnEdicion = null;
let almacenamientoValido = true;

// MENSAJES

function mostrarMensaje(texto, esError = false) {
  elementos.mensaje.textContent = texto;
  elementos.mensaje.classList.toggle("error", esError);
}

function actualizarConexion() {
  elementos.conexion.textContent = navigator.onLine
    ? "Estado de red: conexión disponible."
    : "Estado de red: sin conexión.";
}

// VALIDACIÓN

function tituloValido(titulo) {
  return (
    typeof titulo === "string" &&
    titulo.trim().length >= 1 &&
    titulo.length <= 120
  );
}

function prioridadValida(prioridad) {
  return ["alta", "media", "baja"].includes(prioridad);
}

function tareaValida(tarea) {
  return (
    tarea !== null &&
    typeof tarea === "object" &&
    typeof tarea.id === "string" &&
    tarea.id.length > 0 &&
    tituloValido(tarea.titulo) &&
    prioridadValida(tarea.prioridad) &&
    typeof tarea.completada === "boolean" &&
    typeof tarea.creadaEn === "string" &&
    Number.isFinite(Date.parse(tarea.creadaEn))
  );
}

// ALMACENAMIENTO

function cargarTareas() {
  try {
    const contenido = localStorage.getItem(CLAVE);

    if (contenido === null) {
      tareas = [];
      return;
    }

    const datos = JSON.parse(contenido);

    if (!Array.isArray(datos) || !datos.every(tareaValida)) {
      throw new Error("Formato de almacenamiento incorrecto");
    }

    const ids = new Set(datos.map(tarea => tarea.id));

    if (ids.size !== datos.length) {
      throw new Error("Identificadores duplicados");
    }

    tareas = datos;
  } catch (error) {
    tareas = [];
    almacenamientoValido = false;

    mostrarMensaje(
      "No se pudieron recuperar los datos. " +
      "Se bloquearon las modificaciones para evitar sobrescribirlos.",
      true
    );
  }
}

function guardarTareas(nuevasTareas) {
  if (!almacenamientoValido) {
    mostrarMensaje(
      "Revisa el almacenamiento y recarga antes de modificar tareas.",
      true
    );

    return false;
  }

  try {
    localStorage.setItem(
      CLAVE,
      JSON.stringify(nuevasTareas)
    );

    tareas = nuevasTareas;

    renderizarTareas();

    return true;
  } catch (error) {
    mostrarMensaje(
      "No se guardaron los cambios. " +
      "Revisa el espacio y los permisos del navegador.",
      true
    );

    return false;
  }
}

// INTERFAZ

function crearBoton(texto, accion, titulo) {
  const boton = document.createElement("button");

  boton.type = "button";
  boton.textContent = texto;
  boton.dataset.accion = accion;

  boton.setAttribute(
    "aria-label",
    `${texto} tarea ${titulo}`
  );

  if (accion === "eliminar") {
    boton.classList.add("eliminar");
  }

  return boton;
}

function crearFila(tarea) {
  const fila = document.createElement("li");

  fila.classList.add("tarea");
  fila.dataset.id = tarea.id;

  if (tarea.completada) {
    fila.classList.add("completada");
  }

  const casilla = document.createElement("input");

  casilla.type = "checkbox";
  casilla.checked = tarea.completada;
  casilla.dataset.accion = "estado";

  casilla.setAttribute(
    "aria-label",
    `Cambiar estado de ${tarea.titulo}`
  );

  const contenido = document.createElement("div");
  contenido.classList.add("tarea-contenido");

  const titulo = document.createElement("span");
  titulo.classList.add("tarea-titulo");

  // textContent evita interpretar el título como HTML.
  titulo.textContent = tarea.titulo;

  const detalle = document.createElement("small");
  detalle.classList.add("tarea-detalle");

  detalle.textContent =
    "Creada: " + new Date(tarea.creadaEn).toLocaleString("es-EC");

  contenido.append(titulo, detalle);

  const prioridad = document.createElement("span");

  prioridad.classList.add("prioridad", tarea.prioridad);
  prioridad.textContent = tarea.prioridad.toUpperCase();

  const editar = crearBoton(
    "Editar",
    "editar",
    tarea.titulo
  );

  const eliminar = crearBoton(
    "Eliminar",
    "eliminar",
    tarea.titulo
  );

  fila.append(
    casilla,
    contenido,
    prioridad,
    editar,
    eliminar
  );

  return fila;
}

function actualizarMetricas() {
  const completadas = tareas.filter(
    tarea => tarea.completada
  ).length;

  elementos.total.textContent = tareas.length;
  elementos.completadas.textContent = completadas;
  elementos.pendientes.textContent =
    tareas.length - completadas;
}

function renderizarTareas() {
  elementos.lista.replaceChildren();

  if (tareas.length === 0) {
    const aviso = document.createElement("li");

    aviso.textContent = "Todavía no hay tareas registradas.";

    elementos.lista.append(aviso);
  } else {
    const fragmento = document.createDocumentFragment();

    tareas.forEach(tarea => {
      fragmento.append(crearFila(tarea));
    });

    elementos.lista.append(fragmento);
  }

  actualizarMetricas();
}

// FORMULARIO Y EDICIÓN

function restablecerFormulario() {
  idEnEdicion = null;

  elementos.formulario.reset();
  elementos.tituloFormulario.textContent = "Nueva tarea";
  elementos.guardar.textContent = "Agregar tarea";
  elementos.cancelar.hidden = true;
}

function iniciarEdicion(id) {
  const tarea = tareas.find(tarea => tarea.id === id);

  if (!tarea) {
    return;
  }

  idEnEdicion = id;

  elementos.titulo.value = tarea.titulo;
  elementos.prioridad.value = tarea.prioridad;

  elementos.tituloFormulario.textContent = "Editar tarea";
  elementos.guardar.textContent = "Guardar cambios";
  elementos.cancelar.hidden = false;

  elementos.titulo.focus();
}

function procesarFormulario(evento) {
  evento.preventDefault();

  const titulo = elementos.titulo.value.trim();
  const prioridad = elementos.prioridad.value;

  if (!tituloValido(titulo)) {
    mostrarMensaje(
      "Escribe un título de 1 a 120 caracteres. " +
      "No se aceptan campos vacíos ni solamente espacios.",
      true
    );

    elementos.titulo.focus();

    return;
  }

  if (!prioridadValida(prioridad)) {
    mostrarMensaje("Selecciona una prioridad válida.", true);
    return;
  }

  let nuevasTareas;
  const esEdicion = idEnEdicion !== null;

  if (esEdicion) {
    const existe = tareas.some(
      tarea => tarea.id === idEnEdicion
    );

    if (!existe) {
      restablecerFormulario();

      mostrarMensaje(
        "La tarea que intentabas editar ya no existe.",
        true
      );

      return;
    }

    nuevasTareas = tareas.map(tarea => {
      return tarea.id === idEnEdicion
        ? { ...tarea, titulo, prioridad }
        : tarea;
    });
  } else {
    const nuevaTarea = {
      id: crypto.randomUUID(),
      titulo,
      prioridad,
      completada: false,
      creadaEn: new Date().toISOString()
    };

    nuevasTareas = [...tareas, nuevaTarea];
  }

  if (guardarTareas(nuevasTareas)) {
    restablecerFormulario();

    mostrarMensaje(
      esEdicion
        ? "Tarea actualizada correctamente."
        : "Tarea agregada correctamente."
    );
  }
}

// ELIMINACIÓN Y CAMBIO DE ESTADO

function eliminarTarea(id) {
  const tarea = tareas.find(tarea => tarea.id === id);

  if (!tarea) {
    return;
  }

  const confirmado = confirm(
    `¿Deseas eliminar la tarea "${tarea.titulo}"?`
  );

  if (!confirmado) {
    return;
  }

  const nuevasTareas = tareas.filter(
    tarea => tarea.id !== id
  );

  if (guardarTareas(nuevasTareas)) {
    if (idEnEdicion === id) {
      restablecerFormulario();
    }

    mostrarMensaje("Tarea eliminada correctamente.");
  }
}

function cambiarEstado(id, completada) {
  const nuevasTareas = tareas.map(tarea => {
    return tarea.id === id
      ? { ...tarea, completada }
      : tarea;
  });

  if (guardarTareas(nuevasTareas)) {
    mostrarMensaje("Estado actualizado correctamente.");
  } else {
    // Restaura la casilla si no se pudo guardar.
    renderizarTareas();
  }
}

// EVENTOS

elementos.formulario.addEventListener(
  "submit",
  procesarFormulario
);

elementos.cancelar.addEventListener("click", () => {
  restablecerFormulario();
  mostrarMensaje("Edición cancelada.");
});

elementos.lista.addEventListener("click", evento => {
  const boton = evento.target.closest(
    "button[data-accion]"
  );

  if (!boton) {
    return;
  }

  const fila = boton.closest("li[data-id]");

  if (!fila) {
    return;
  }

  const id = fila.dataset.id;

  if (boton.dataset.accion === "editar") {
    iniciarEdicion(id);
  }

  if (boton.dataset.accion === "eliminar") {
    eliminarTarea(id);
  }
});

elementos.lista.addEventListener("change", evento => {
  const casilla = evento.target;

  if (!casilla.matches('input[data-accion="estado"]')) {
    return;
  }

  const fila = casilla.closest("li[data-id]");

  if (!fila) {
    return;
  }

  cambiarEstado(fila.dataset.id, casilla.checked);
});

window.addEventListener("online", actualizarConexion);
window.addEventListener("offline", actualizarConexion);

// INICIO

cargarTareas();
renderizarTareas();
actualizarConexion();