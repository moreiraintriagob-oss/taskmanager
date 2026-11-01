"use strict";

// Práctica de depuración con dos errores intencionales.

const CLAVE = "taskmanager.v1";

const API =
  "https://jsonplaceholder.typicode.com/todos?_limit=10;

const elementos = {
  formulario: document.getElementById("formulario"),
  titulo: document.getElementById("titulo"),
  buscar: document.getElementById("buscar"),
  filtro: document.getElementById("filtro"),
  importar: document.getElementById("importar"),
  mensaje: document.getElementById("mensaje"),
  resumen: document.getElementById("resumen")
  lista: document.getElementById("lista")
};

let tareas = [];

function mostrarMensaje(texto) {
  elementos.mensaje.textContent = texto;
}

function tituloValido(titulo) {
  return (
    typeof titulo === "string" &&
    titulo.trim().length > 0 &&
    titulo.length <= 120
  );
}

function cargarTareas() {
  try {
    const contenido = localStorage.getItem(CLAVE);
    const datos = contenido === null ? [] : JSON.parse(contenido);

    const formatoValido =
      Array.isArray(datos) &&
      datos.every(tarea => {
        return (
          tarea !== null &&
          typeof tarea === "object" &&
          typeof tarea.id === "string" &&
          tarea.id.length > 0 &&
          tituloValido(tarea.titulo) &&
          typeof tarea.completada === "boolean"
        );
      });

    if (!formatoValido) {
      throw new Error("Datos locales incorrectos");
    }

    const ids = new Set(datos.map(tarea => tarea.id));

    if (ids.size !== datos.length) {
      throw new Error("Identificadores duplicados");
    }

    tareas = datos;
  } catch (error) {
    tareas = [];

    mostrarMensaje(
      "No se pudieron cargar las tareas. " +
      "Revisa el almacenamiento antes de guardar cambios."
    );
  }
}

function guardarTareas(nuevasTareas) {
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
      "Revisa el espacio y los permisos del navegador."
    );

    return false;
  }
}

function renderizarTareas() {
  const consulta = elementos.buscar.value
    .trim()
    .toLocaleLowerCase();

  const filtro = elementos.filtro.value;

  const visibles = tareas.filter(tarea => {
    const coincideTitulo = tarea.titulo
      .toLocaleLowerCase()
      .includes(consulta);

    const coincideEstado =
      filtro === "todas" ||
      (filtro === "pendientes" && !tarea.completada) ||
      (filtro === "completadas" && tarea.completada);

    return coincideTitulo && coincideEstado;
  });

  elementos.lista.replaceChildren();

  visibles.forEach(tarea => {
    const fila = document.createElement("li");
    fila.dataset.id = tarea.id;

    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.checked = tarea.completada;
    casilla.dataset.accion = "estado";

    casilla.setAttribute(
      "aria-label",
      "Cambiar estado de " + tarea.titulo
    );

    const texto = document.createElement("span");
    texto.textContent = tarea.titulo;

    if (tarea.completada) {
      texto.classList.add("completada");
    }

    fila.append(casilla, texto);

    ["editar", "eliminar"].forEach(accion => {
      const boton = document.createElement("button");

      boton.type = "button";
      boton.dataset.accion = accion;
      boton.textContent =
        accion === "editar" ? "Editar" : "Eliminar";

      fila.append(boton);
    });

    elementos.lista.append(fila);
  });

  if (visibles.length === 0) {
    const aviso = document.createElement("li");

    aviso.textContent =
      "No hay tareas para esta búsqueda o filtro.";

    elementos.lista.append(aviso);
  }

  const completadas = tareas.filter(
    tarea => tarea.completada
  ).length;

  elementos.resumen.textContent =
    `Total: ${tareas.length} | ` +
    `Completadas: ${completadas} | ` +
    `Pendientes: ${tareas.length - completadas}`;
}

elementos.formulario.addEventListener("submit", evento => {
  evento.preventDefault();

  const titulo = elementos.titulo.value.trim();

  if (!tituloValido(titulo)) {
    mostrarMensaje(
      "Escribe un título de 1 a 120 caracteres."
    );

    return;
  }

  const nuevaTarea = {
    id: crypto.randomUUID(),
    titulo,
    completada: false
  };

  if (guardarTareas([...tareas, nuevaTarea])) {
    elementos.formulario.reset();
    elementos.titulo.focus();

    mostrarMensaje("Tarea agregada correctamente.");
  }
});

elementos.lista.addEventListener("click", evento => {
  const boton = evento.target.closest(
    "button[data-accion]"
  );

  if (!boton) {
    return;
  }

  const id = boton.closest("li").dataset.id;
  const tarea = tareas.find(tarea => tarea.id === id);

  if (!tarea) {
    return;
  }

  if (boton.dataset.accion === "eliminar") {
    const confirmado = confirm(
      `¿Eliminar la tarea "${tarea.titulo}"?`
    );

    if (confirmado) {
      const nuevasTareas = tareas.filter(
        tarea => tarea.id !== id
      );

      if (guardarTareas(nuevasTareas)) {
        mostrarMensaje("Tarea eliminada.");
      }
    }

    return;
  }

  const respuesta = prompt(
    "Escribe el nuevo título:",
    tarea.titulo
  );

  if (respuesta === null) {
    return;
  }

  const titulo = respuesta.trim();

  if (!tituloValido(titulo)) {
    mostrarMensaje(
      "El título debe tener de 1 a 120 caracteres."
    );

    return;
  }

  const nuevasTareas = tareas.map(tarea => {
    return tarea.id === id
      ? { ...tarea, titulo }
      : tarea;
  });

  if (guardarTareas(nuevasTareas)) {
    mostrarMensaje("Tarea actualizada.");
  }
});

elementos.lista.addEventListener("change", evento => {
  const casilla = evento.target;

  if (!casilla.matches('input[data-accion="estado"]')) {
    return;
  }

  const id = casilla.closest("li").dataset.id;
  const completada = casilla.checked;

  const nuevasTareas = tareas.map(tarea => {
    return tarea.id === id
      ? { ...tarea, completada }
      : tarea;
  });

  if (guardarTareas(nuevasTareas)) {
    mostrarMensaje("Estado actualizado.");
  } else {
    renderizarTareas();
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

elementos.importar.addEventListener("click", async () => {
  elementos.importar.disabled = true;

  mostrarMensaje("Consultando API...");

  const controlador = new AbortController();

  const temporizador = setTimeout(() => {
    controlador.abort();
  }, 10000);

  try {
    const respuesta = await fetch(API, {
      signal: controlador.signal
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

    datos.forEach(tarea => {
      const id = `api-${tarea.id}`;

      if (ids.has(id)) {
        return;
      }

      ids.add(id);

      importadas.push({
        id,
        titulo: tarea.title.trim().slice(0, 120),
        completada: tarea.completed
      });
    });

    if (importadas.length === 0) {
      mostrarMensaje("No hay tareas nuevas para importar.");
      return;
    }

    if (guardarTareas([...tareas, ...importadas])) {
      mostrarMensaje(
        `Se importaron ${importadas.length} tareas.`
      );
    }
  } catch (error) {
    mostrarMensaje(
      "No fue posible importar. " +
      "Puedes continuar utilizando tus tareas locales."
    );
  } finally {
    clearTimeout(temporizador);
    elementos.importar.disabled = false;
  }
});

cargarTareas();
renderizarTareas();