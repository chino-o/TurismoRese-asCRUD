/* ========= SEED DE DATOS ========= */
const SEED_KEY = "seedV1";

const SEED = {
  categorias: [
    "Cafeterías", "Librerías", "Aire Libre"
  ],
  lugares: [
    { id: 1, nombre: "Cafe Plaza", categoria: "Cafeterías" },
    { id: 2, nombre: "The Coffe Rancagua", categoria: "Cafeterías" },
    { id: 3, nombre: "Cafe de la Tarde", categoria: "Cafeterías" },
    { id: 7, nombre: "Libreria del centro", categoria: "Librerías" },
    { id: 8, nombre: "El Rincon del Lector", categoria: "Librerías" },
    { id: 9, nombre: "Cafe Literario", categoria: "Librerías" },
    { id: 10, nombre: "Parque Koke", categoria: "Aire Libre" },
    { id: 11, nombre: "Parque Comunal", categoria: "Aire Libre" },
    { id: 12, nombre: "Centro Deportivo Paticio Mekis", categoria: "Aire Libre" }
  ]
};

function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return;
  localStorage.setItem("categorias", JSON.stringify(SEED.categorias));
  localStorage.setItem("lugares", JSON.stringify(SEED.lugares));
  localStorage.setItem("reseñas", JSON.stringify([]));
  localStorage.setItem("usuarios", JSON.stringify([])); // Inicializa la lista de usuarios
  localStorage.setItem(SEED_KEY, "true");
}

function normalizeUsuariosIds() {
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  let changed = false;
  let maxId = usuarios.reduce((max, u) => (typeof u.id === "number" && u.id > max ? u.id : max), 0);
  usuarios.forEach(u => {
    if (typeof u.id !== "number") {
      maxId += 1;
      u.id = maxId;
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
  }
  return usuarios;
}

/* ========= LOGIN ========= */
function iniciarSesion() {
  seedIfNeeded();
  const nombreUsuario = document.getElementById("nombreUsuario")?.value?.trim();
  const clave = document.getElementById("claveUsuario")?.value?.trim();
  if (!nombreUsuario || !clave) {
    alert("Ingresa usuario y contraseña.");
    return;
  }

  const usuarios = normalizeUsuariosIds();
  const usuarioEncontrado = usuarios.find(u => u.nombre === nombreUsuario && u.clave === clave);

  if (usuarioEncontrado) {
    localStorage.setItem("usuarioActivo", nombreUsuario);
    window.location.href = "categorias.html";
  } else {
    alert("Usuario o contraseña incorrectos.");
  }
}

function registrarUsuario() {
  seedIfNeeded();
  const nuevoUsuario = document.getElementById("nuevoUsuario")?.value?.trim();
  const nuevaClave = document.getElementById("nuevaClave")?.value?.trim();

  if (!nuevoUsuario || !nuevaClave) {
    alert("Por favor, completa ambos campos para registrarte.");
    return;
  }

  const usuarios = normalizeUsuariosIds();
  const usuarioExiste = usuarios.some(u => u.nombre === nuevoUsuario);

  if (usuarioExiste) {
    alert("El nombre de usuario ya existe. Por favor, elige otro.");
    return;
  }

  const maxId = usuarios.reduce((max, u) => (typeof u.id === "number" && u.id > max ? u.id : max), 0);
  const nuevoId = maxId + 1;
  usuarios.push({ id: nuevoId, nombre: nuevoUsuario, clave: nuevaClave });
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
  document.getElementById("nuevoUsuario").value = "";
  document.getElementById("nuevaClave").value = "";
}

function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "index.html";
}

/* ========= AUTH ========= */
function ensureAuthOrRedirect() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    window.location.href = "index.html";
    return null;
  }
  const el = document.getElementById("usuarioActivo");
  if (el) el.innerText = "Usuario: " + usuario;
  return usuario;
}

/* ========= ACCESO BASE DE DATOS (ADMIN) ========= */
function abrirBD() {
  const usuario = localStorage.getItem("usuarioActivo");

  if (!usuario) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  if (usuario.toLowerCase() === "admin") {
    window.location.href = "reportes.html";
  } else {
    alert("Acceso restringido: solo el administrador puede entrar a la Base de Datos.");
  }
}

function configurarBotonBD(usuario) {
  const btn = document.getElementById("btnReportes");
  if (!btn) return;

  btn.innerText = "Base de datos (BD)";

  if (usuario && usuario.toLowerCase() === "admin") {
    btn.style.display = "inline-block";
    btn.onclick = abrirBD;
  } else {
    btn.style.display = "none";
    btn.onclick = null;
  }
}

/* ========= CATEGORÍAS ========= */
function cargarCategorias() {
  const usuario = ensureAuthOrRedirect();
  if (!usuario) return;

  seedIfNeeded();
  configurarBotonBD(usuario);

  const cont = document.getElementById("listaCategorias");
  const categorias = JSON.parse(localStorage.getItem("categorias")) || [];

  cont.innerHTML = "";
  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.innerText = cat;
    btn.onclick = () => mostrarLugaresPorCategoria(cat);
    cont.appendChild(btn);
    cont.appendChild(document.createElement("br"));
  });
}

function mostrarLugaresPorCategoria(categoria) {
  const titulo = document.getElementById("tituloLugares");
  const lista = document.getElementById("listaLugares");

  if (titulo) titulo.innerText = "Lugares de " + categoria;
  if (!lista) return;
  lista.innerHTML = "";

  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const filtrados = lugares.filter(l => l.categoria === categoria);

  filtrados.forEach(l => {
    const btn = document.createElement("button");
    btn.innerText = l.nombre;
    btn.onclick = () => {
      localStorage.setItem("lugarSeleccionadoId", String(l.id));
      localStorage.setItem("lugarSeleccionadoNombre", l.nombre);
      window.location.href = "reseñas.html";
    };
    lista.appendChild(btn);
    lista.appendChild(document.createElement("br"));
  });
}

/* ========= LUGARES ========= */
function cargarLugares() {
  const usuario = ensureAuthOrRedirect();
  if (!usuario) return;

  seedIfNeeded();
  const cat = localStorage.getItem("categoriaSeleccionada");
  const titulo = document.getElementById("tituloCategoria");
  if (titulo && cat) {
    titulo.innerText = "Lugares - " + cat;
  }

  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const lista = document.getElementById("listaLugares");

  const filtrados = lugares.filter(l => l.categoria === cat);
  if (lista) {
    lista.innerHTML = "";
    filtrados.forEach(l => {
      const btn = document.createElement("button");
      btn.innerText = l.nombre;
      btn.onclick = () => {
        localStorage.setItem("lugarSeleccionadoId", String(l.id));
        localStorage.setItem("lugarSeleccionadoNombre", l.nombre);
        window.location.href = "reseñas.html";
      };
      lista.appendChild(btn);
      lista.appendChild(document.createElement("br"));
    });
  }
}

function irCategorias() {
  window.location.href = "categorias.html";
}

/* ========= RESEÑAS ========= */
let reseñasCache = [];

function cargarReseñasPorLugar() {
  const usuario = ensureAuthOrRedirect();
  if (!usuario) return;

  seedIfNeeded();
  const lugarId = parseInt(localStorage.getItem("lugarSeleccionadoId"));
  const lugarNombre = localStorage.getItem("lugarSeleccionadoNombre");

  const tituloLugar = document.getElementById("tituloLugar");
  if (tituloLugar) {
    tituloLugar.innerText = "Reseñas — " + lugarNombre;
  }

  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  mostrarReseñasLugar(lugarId);
  calcularPromedioLugar(lugarId);
}

function mostrarReseñasLugar(idLugar) {
  const ul = document.getElementById("listaReseñas");
  const delLugar = reseñasCache.filter(r => r.idLugar === idLugar);
  const usuarioActivo = localStorage.getItem("usuarioActivo");

  if (!ul) return;
  ul.innerHTML = "";
  delLugar.forEach((r, idx) => {
    const li = document.createElement("li");
    let buttonsHTML = "";

    if (r.usuario === usuarioActivo) {
      buttonsHTML = `
        <button onclick="editarReseña(${idLugar}, ${idx})">Editar</button>
        <button onclick="eliminarReseña(${idLugar}, ${idx})">Eliminar</button>`;
    }
    li.innerHTML = `<b>${r.usuario}</b>: "${r.comentario}" ⭐${r.calificacion} ${buttonsHTML}`;
    ul.appendChild(li);
  });
}

function agregarReseña() {
  const comentario = document.getElementById("comentario").value.trim();
  const calif = parseInt(document.getElementById("calificacion").value);
  const usuario = localStorage.getItem("usuarioActivo");
  const idLugar = parseInt(localStorage.getItem("lugarSeleccionadoId"));

  if (!comentario || !(calif >= 1 && calif <= 5)) {
    alert("Completa comentario y calificación válida.");
    return;
  }

  let reseñas = JSON.parse(localStorage.getItem("reseñas")) || [];

  reseñas.push({
    idLugar,
    usuario,
    comentario,
    calificacion: calif
  });

  localStorage.setItem("reseñas", JSON.stringify(reseñas));

  document.getElementById("comentario").value = "";
  document.getElementById("calificacion").value = "";

  reseñasCache = reseñas;
  mostrarReseñasLugar(idLugar);
  calcularPromedioLugar(idLugar);
}

function editarReseña(idLugar, idxEnFiltrado) {
  const indices = reseñasCache
    .map((r, i) => ({ r, i }))
    .filter(x => x.r.idLugar === idLugar)
    .map(x => x.i);

  const realIdx = indices[idxEnFiltrado];
  const r = reseñasCache[realIdx];

  const nuevoComentario = prompt("Nuevo comentario:", r.comentario) ?? r.comentario;
  const nuevaCalif = parseInt(prompt("Nueva calificación (1-5):", r.calificacion)) || r.calificacion;

  reseñasCache[realIdx] = { ...r, comentario: nuevoComentario, calificacion: nuevaCalif };
  localStorage.setItem("reseñas", JSON.stringify(reseñasCache));
  mostrarReseñasLugar(idLugar);
  calcularPromedioLugar(idLugar);
}

function eliminarReseña(idLugar, idxEnFiltrado) {
  const indices = reseñasCache
    .map((r, i) => ({ r, i }))
    .filter(x => x.r.idLugar === idLugar)
    .map(x => x.i);

  const realIdx = indices[idxEnFiltrado];
  reseñasCache.splice(realIdx, 1);
  localStorage.setItem("reseñas", JSON.stringify(reseñasCache));
  mostrarReseñasLugar(idLugar);
  calcularPromedioLugar(idLugar);
}

function calcularPromedioLugar(idLugar) {
  const p = document.getElementById("promedio");
  const c = document.getElementById("conteo");

  const delLugar = reseñasCache.filter(r => r.idLugar === idLugar);
  if (delLugar.length === 0) {
    if (p) p.innerText = "Promedio: — (sin reseñas)";
    if (c) c.innerText = "Total de reseñas: 0";
    return;
  }

  const total = delLugar.reduce((sum, r) => sum + r.calificacion, 0);
  const promedio = total / delLugar.length;

  if (p) p.innerText = "Promedio: " + promedio.toFixed(1);
  if (c) c.innerText = "Total de reseñas: " + delLugar.length;
}

function irLugares() {
  window.location.href = "lugares.html";
}

/* ========= REPORTES ========= */
function listarGlobal() {
  const ul = document.getElementById("listadoGlobal");
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];

  if (!ul) return;
  ul.innerHTML = "";
  reseñasCache.forEach((r, i) => {
    const lugar = lugares.find(l => l.id === r.idLugar);
    const nombreLugar = lugar ? lugar.nombre : "Lugar desconocido";
    ul.innerHTML += `<li><b>Usuario:</b> ${r.usuario} | <b>Lugar:</b> ${nombreLugar} <br> "${r.comentario}" ⭐${r.calificacion}
      <button onclick="editarReseñaGlobal(${i})">Editar</button> <button onclick="eliminarReseñaGlobal(${i})">Eliminar</button></li>`;
  });
}

function buscarPorUsuario() {
  const input = document.getElementById("buscarUsuario").value.trim().toLowerCase();
  const resultado = document.getElementById("resultadoBusqueda");

  if (!input) {
    resultado.innerText = "Por favor, escribe un nombre de usuario o un ID.";
    return;
  }

  const reseñas = JSON.parse(localStorage.getItem("reseñas")) || [];
  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const usuarios = normalizeUsuariosIds();

  const usuarioEncontrado = usuarios.find(u =>
    u.nombre.toLowerCase() === input || String(u.id) === input
  );

  if (!usuarioEncontrado) {
    resultado.innerText = "No se encontró un usuario con ese nombre o ID.";
    return;
  }

  const filtradas = reseñas.filter(r => r.usuario.toLowerCase() === usuarioEncontrado.nombre.toLowerCase());

  if (filtradas.length === 0) {
    resultado.innerHTML = `<b>Usuario:</b> ${usuarioEncontrado.nombre} (ID: ${usuarioEncontrado.id})<br>Este usuario no tiene reseñas.`;
    return;
  }

  let htmlResultado = `<b>Usuario:</b> ${usuarioEncontrado.nombre} (ID: ${usuarioEncontrado.id})<br>`;
  htmlResultado += filtradas.map(r => {
    const lugar = lugares.find(l => l.id === r.idLugar);
    const nombreLugar = lugar ? lugar.nombre : "Lugar desconocido";
    return `• "${r.comentario}" en ${nombreLugar} ⭐${r.calificacion}`;
  }).join("<br>");

  resultado.innerHTML = htmlResultado;
}

function filtrarRango() {
  const min = parseInt(document.getElementById("min").value);
  const max = parseInt(document.getElementById("max").value);
  const ul = document.getElementById("resultadoRango");

  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  if (!ul) return;
  ul.innerHTML = "";

  reseñasCache
    .filter(r => r.calificacion >= min && r.calificacion <= max)
    .forEach(r => {
      ul.innerHTML += `<li>${r.usuario}: "${r.comentario}" ⭐${r.calificacion}</li>`;
    });
}

function editarReseñaGlobal(idx) {
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  const r = reseñasCache[idx];
  if (!r) return;

  const nuevoComentario = prompt("Nuevo comentario:", r.comentario) ?? r.comentario;
  const nuevaCalif = parseInt(prompt("Nueva calificación (1-5):", r.calificacion)) || r.calificacion;

  reseñasCache[idx] = { ...r, comentario: nuevoComentario, calificacion: nuevaCalif };
  localStorage.setItem("reseñas", JSON.stringify(reseñasCache));
  listarGlobal();
}

function eliminarReseñaGlobal(idx) {
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  reseñasCache.splice(idx, 1);
  localStorage.setItem("reseñas", JSON.stringify(reseñasCache));
  listarGlobal();
}

/* ========= DISPATCH ========= */
window.onload = () => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("categorias.html")) cargarCategorias();
  if (path.endsWith("lugares.html")) cargarLugares();
  if (path.endsWith("reseñas.html")) cargarReseñasPorLugar();
  if (path.endsWith("reportes.html")) {
    const usuario = ensureAuthOrRedirect();
    if (!usuario) return;
    if (usuario.toLowerCase() !== "admin") {
      alert("Acceso restringido: solo el administrador puede entrar a la Base de Datos.");
      window.location.href = "categorias.html";
      return;
    }
    listarGlobal();
  }
  if (path.endsWith("index.html")) seedIfNeeded();
};
