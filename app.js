"use strict";

// ETAPA 5: CustomEvent y funcionamiento offline.

const CLAVE = "taskmanager.v2";
const API = "https://jsonplaceholder.typicode.com/todos";
const EVENTO_TAREAS = "tareas:actualizadas";

const porId = id => document.getElementById(id);

const elementos = {
  formulario: porId("formulario"),
  tituloFormulario: porId("titulo-formulario"),
  titulo: porId("titulo"),
  prioridad: porId("prioridad"),
  guardar: porId("guardar"),
  cancelar: porId("cancelar"),
  conexion: porId("conexion"),
  mensaje: porId("mensaje"),
  lista: porId("lista"),
  total: porId("total"),
  pendientes: porId("pendientes"),
  completadas: porId("completadas"),
  buscar: porId("buscar"),
  filtro: porId("filtro"),
  orden: porId("orden")
};

let tareas = [];
let idEnEdicion = null;
let almacenamientoValido = true;
let importando = false;

// CONTROLES ADICIONALES

const botonAPI = document.createElement("button");

botonAPI.type = "button";
botonAPI.classList.add("secundario");
botonAPI.textContent = "Importar tareas de ejemplo";

elementos.mensaje.before(botonAPI);

const estadoOffline = document.createElement("p");

estadoOffline.setAttribute("role", "status");
estadoOffline.textContent =
  "Preparando archivos para uso offline...";

elementos.conexion.after(estadoOffline);

// MENSAJES Y CONEXIÓN

function mostrarMensaje(texto, error = false) {
  elementos.mensaje.textContent = texto;
  elementos.mensaje.classList.toggle("error", error);
}

function actualizarConexion() {
  elementos.conexion.textContent = navigator.onLine
    ? "Estado de red: conexión disponible."
    : "Estado de red: sin conexión.";
}

// VALIDACIONES

function tituloValido(titulo) {
  return (
    typeof titulo === "string" &&
    titulo.trim().length > 0 &&
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

// CUSTOM EVENT Y PATRÓN OBSERVADOR

function notificarCambio(motivo) {
  document.dispatchEvent(
    new CustomEvent(EVENTO_TAREAS, {
      detail: {
        motivo,
        total: tareas.length
      }
    })
  );
}

// Este observador actualiza la interfaz cuando cambia el estado.
document.addEventListener(EVENTO_TAREAS, () => {
  renderizarTareas();
  actualizarMetricas();
});

// ALMACENAMIENTO LOCAL

function cargarTareas() {
  try {
    const contenido = localStorage.getItem(CLAVE);

    if (contenido === null) {
      tareas = [];
      return true;
    }

    const datos = JSON.parse(contenido);

    if (!Array.isArray(datos) || !datos.every(tareaValida)) {
      throw new Error("Formato de almacenamiento incorrecto");
    }

    const identificadores = new Set(
      datos.map(tarea => tarea.id)
    );

    if (identificadores.size !== datos.length) {
      throw new Error("Identificadores duplicados");
    }

    tareas = datos;

    // Un arreglo vacío guardado también se respeta.
    return false;
  } catch (error) {
    tareas = [];
    almacenamientoValido = false;

    mostrarMensaje(
      "No se pudieron recuperar los datos. " +
      "Revisa el almacenamiento antes de modificar tareas.",
      true
    );

    return false;
  }
}

function guardarTareas(nuevasTareas) {
  if (!almacenamientoValido) {
    mostrarMensaje(
      "Se bloquearon los cambios para proteger los datos locales.",
      true
    );

    return false;
  }

  try {
    localStorage.setItem(
      CLAVE,
      JSON.stringify(nuevasTareas)
    );
  } catch (error) {
    mostrarMensaje(
      "No se guardaron los cambios. Revisa espacio y permisos.",
      true
    );

    return false;
  }

  tareas = nuevasTareas;

  // Solo se notifica después de guardar correctamente.
  notificarCambio("modificacion");

  return true;
}

// CONSTRUCCIÓN DE LA INTERFAZ

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
  titulo.textContent = tarea.titulo;

  const detalle = document.createElement("small");
  detalle.classList.add("tarea-detalle");

  const origen = tarea.id.startsWith("api-")
    ? "Importada"
    : "Creada";

  detalle.textContent =
    origen + ": " +
    new Date(tarea.creadaEn).toLocaleString("es-EC");

  contenido.append(titulo, detalle);

  const prioridad = document.createElement("span");

  prioridad.classList.add("prioridad", tarea.prioridad);
  prioridad.textContent = tarea.prioridad.toUpperCase();

  fila.append(
    casilla,
    contenido,
    prioridad,
    crearBoton("Editar", "editar", tarea.titulo),
    crearBoton("Eliminar", "eliminar", tarea.titulo)
  );

  return fila;
}

// DASHBOARD

function actualizarMetricas() {
  const completas = tareas.filter(
    tarea => tarea.completada
  ).length;

  elementos.total.textContent = tareas.length;
  elementos.completadas.textContent = completas;

  elementos.pendientes.textContent =
    tareas.length - completas;
}

// BÚSQUEDA, FILTROS Y ORDENAMIENTO

function obtenerTareasVisibles() {
  const consulta = elementos.buscar.value
    .trim()
    .toLowerCase();

  const estado = elementos.filtro.value;
  const orden = elementos.orden.value;

  const visibles = tareas.filter(tarea => {
    const coincideTitulo = tarea.titulo
      .toLowerCase()
      .includes(consulta);

    const coincideEstado =
      estado === "todas" ||
      (estado === "pendientes" && !tarea.completada) ||
      (estado === "completadas" && tarea.completada);

    return coincideTitulo && coincideEstado;
  });

  const valor = {
    alta: 1,
    media: 2,
    baja: 3
  };

  visibles.sort((primera, segunda) => {
    const fechaPrimera = Date.parse(primera.creadaEn);
    const fechaSegunda = Date.parse(segunda.creadaEn);

    if (orden === "antiguas") {
      return fechaPrimera - fechaSegunda;
    }

    if (orden === "prioridad") {
      return (
        valor[primera.prioridad] -
        valor[segunda.prioridad]
      ) || fechaSegunda - fechaPrimera;
    }

    return fechaSegunda - fechaPrimera;
  });

  return visibles;
}

function renderizarTareas() {
  const visibles = obtenerTareasVisibles();

  elementos.lista.replaceChildren();

  if (visibles.length === 0) {
    const aviso = document.createElement("li");

    aviso.textContent = tareas.length === 0
      ? "Todavía no hay tareas registradas."
      : "No hay coincidencias para la búsqueda y el filtro.";

    elementos.lista.append(aviso);
    return;
  }

  const fragmento = document.createDocumentFragment();

  visibles.forEach(tarea => {
    fragmento.append(crearFila(tarea));
  });

  elementos.lista.append(fragmento);
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

  const esEdicion = idEnEdicion !== null;
  let siguientes;

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

    siguientes = tareas.map(tarea => {
      return tarea.id === idEnEdicion
        ? { ...tarea, titulo, prioridad }
        : tarea;
    });
  } else {
    siguientes = [
      ...tareas,
      {
        id: crypto.randomUUID(),
        titulo,
        prioridad,
        completada: false,
        creadaEn: new Date().toISOString()
      }
    ];
  }

  if (guardarTareas(siguientes)) {
    restablecerFormulario();

    mostrarMensaje(
      esEdicion
        ? "Tarea actualizada."
        : "Tarea agregada. Si no aparece, revisa la búsqueda y el filtro."
    );
  }
}

// ELIMINACIÓN Y CAMBIO DE ESTADO

function eliminarTarea(id) {
  const tarea = tareas.find(tarea => tarea.id === id);

  if (!tarea) {
    return;
  }

  if (!confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) {
    return;
  }

  const siguientes = tareas.filter(
    tarea => tarea.id !== id
  );

  if (guardarTareas(siguientes)) {
    if (idEnEdicion === id) {
      restablecerFormulario();
    }

    mostrarMensaje("Tarea eliminada.");
  }
}

function cambiarEstado(id, completada) {
  const siguientes = tareas.map(tarea => {
    return tarea.id === id
      ? { ...tarea, completada }
      : tarea;
  });

  if (guardarTareas(siguientes)) {
    mostrarMensaje("Estado actualizado.");
  } else {
    renderizarTareas();
  }
}

// CONSUMO DE API REST

async function importarTareas() {
  if (importando) {
    return;
  }

  if (!almacenamientoValido) {
    mostrarMensaje(
      "Revisa el almacenamiento antes de importar.",
      true
    );

    return;
  }

  importando = true;
  botonAPI.disabled = true;
  botonAPI.textContent = "Importando...";

  mostrarMensaje("Consultando JSONPlaceholder...");

  const controlador = new AbortController();

  const temporizador = setTimeout(() => {
    controlador.abort();
  }, 10000);

  try {
    const respuesta = await fetch(API, {
      signal: controlador.signal,
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error("Error HTTP " + respuesta.status);
    }

    const datos = await respuesta.json();

    const formatoValido =
      Array.isArray(datos) &&
      datos.every(tarea => {
        return (
          tarea !== null &&
          typeof tarea === "object" &&
          Number.isInteger(tarea.id) &&
          tarea.id > 0 &&
          typeof tarea.title === "string" &&
          tarea.title.trim().length > 0 &&
          typeof tarea.completed === "boolean"
        );
      });

    if (!formatoValido) {
      throw new Error("Respuesta inesperada");
    }

    const ids = new Set(
      tareas.map(tarea => tarea.id)
    );

    const importadas = [];
    const fecha = new Date().toISOString();

    datos.forEach(tarea => {
      const id = `api-${tarea.id}`;

      if (ids.has(id)) {
        return;
      }

      ids.add(id);

      importadas.push({
        id,
        titulo: tarea.title.trim().slice(0, 120),
        prioridad: "media",
        completada: tarea.completed,
        creadaEn: fecha
      });
    });

    if (importadas.length === 0 && tareas.length > 0) {
      mostrarMensaje(
        "No hay tareas nuevas. Se conservaron tus cambios."
      );

      return;
    }

    if (guardarTareas([...tareas, ...importadas])) {
      mostrarMensaje(
        `Se importaron ${importadas.length} tareas sin duplicar.`
      );
    }
  } catch (error) {
    const causa = error.name === "AbortError"
      ? "La consulta superó el tiempo de espera."
      : "No fue posible consultar el servicio de tareas.";

    mostrarMensaje(
      causa + " Puedes seguir utilizando tus tareas locales.",
      true
    );
  } finally {
    clearTimeout(temporizador);

    importando = false;
    botonAPI.disabled = false;
    botonAPI.textContent = "Importar tareas de ejemplo";
  }
}

// REGISTRO DEL SERVICE WORKER

async function prepararOffline() {
  if (!("serviceWorker" in navigator)) {
    estadoOffline.textContent =
      "Este navegador no admite el modo offline completo.";

    return;
  }

  const informarControl = () => {
    estadoOffline.textContent =
      "Archivos preparados para uso offline. " +
      "Conserva esta misma dirección y puerto.";
  };

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    informarControl
  );

  try {
    await navigator.serviceWorker.register(
      "./service-worker.js"
    );

    await navigator.serviceWorker.ready;

    if (navigator.serviceWorker.controller) {
      informarControl();
    } else {
      estadoOffline.textContent =
        "Archivos guardados. Recarga para activar el modo offline.";
    }
  } catch (error) {
    if (navigator.serviceWorker.controller) {
      informarControl();
    } else {
      estadoOffline.textContent =
        "No se pudo preparar el modo offline. " +
        "Comprueba service-worker.js y abre mediante Live Server.";
    }
  }
}

// EVENTOS DEL USUARIO

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

  if (boton.dataset.accion === "editar") {
    iniciarEdicion(fila.dataset.id);
  }

  if (boton.dataset.accion === "eliminar") {
    eliminarTarea(fila.dataset.id);
  }
});

elementos.lista.addEventListener("change", evento => {
  const casilla = evento.target;

  if (!casilla.matches('input[data-accion="estado"]')) {
    return;
  }

  const fila = casilla.closest("li[data-id]");

  if (fila) {
    cambiarEstado(fila.dataset.id, casilla.checked);
  }
});

elementos.buscar.addEventListener(
  "input",
  renderizarTareas
);

elementos.filtro.addEventListener(
  "change",
  renderizarTareas
);

elementos.orden.addEventListener(
  "change",
  renderizarTareas
);

botonAPI.addEventListener(
  "click",
  importarTareas
);

window.addEventListener(
  "online",
  actualizarConexion
);

window.addEventListener(
  "offline",
  actualizarConexion
);

// INICIALIZACIÓN

const necesitaCargaInicial = cargarTareas();

notificarCambio("inicio");
actualizarConexion();
prepararOffline();

if (necesitaCargaInicial) {
  importarTareas();
}