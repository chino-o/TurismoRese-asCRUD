/* ========= SEED DE DATOS ========= */
const SEED_KEY = "seedV1";

const SEED = {
  categorias: [
    "Cafeterías",
    "Cosas Geek",
    "Librerías",
    "Aire Libre",
    "Entretenimiento"
  ],
  lugares: [
    { id: 1, nombre: "Cafe Plaza", categoria: "Cafeterías" },
    { id: 2, nombre: "The Coffe Rancagua", categoria: "Cafeterías" },
    { id: 3, nombre: "Cafe de la Tarde", categoria: "Cafeterías" },
    { id: 4, nombre: "Tienda de comics Z", categoria: "Cosas Geek" },
    { id: 5, nombre: "Arcade Retro", categoria: "Cosas Geek" },
    { id: 6, nombre: "Coleccionables OHiggins", categoria: "Cosas Geek" },
    { id: 7, nombre: "Libreria del centro", categoria: "Librerías" },
    { id: 8, nombre: "El Rincon del Lector", categoria: "Librerías" },
    { id: 9, nombre: "Cafe Literario", categoria: "Librerías" },
    { id: 10, nombre: "Parque Koke", categoria: "Aire Libre" },
    { id: 11, nombre: "Parque Comunal", categoria: "Aire Libre" },
    { id: 12, nombre: "Centro Deportivo Paticio Mekis", categoria: "Aire Libre" },
    { id: 13, nombre: "Cinemark Rancagua", categoria: "Entretenimiento" },
    { id: 14, nombre: "Escape Room Central", categoria: "Entretenimiento" },
    { id: 15, nombre: "Cinemark Open Plaza", categoria: "Entretenimiento" }
  ]
};

function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return;
  localStorage.setItem("categorias", JSON.stringify(SEED.categorias));
  localStorage.setItem("lugares", JSON.stringify(SEED.lugares));
  localStorage.setItem("reseñas", JSON.stringify([]));
  localStorage.setItem(SEED_KEY, "true");
}

/* ========= LOGIN ========= */
function iniciarSesion() {
  seedIfNeeded();
  const usuario = document.getElementById("nombreUsuario")?.value?.trim();
  const clave = document.getElementById("claveUsuario")?.value?.trim();
  if (!usuario || !clave) {
    alert("Ingresa usuario y contraseña (cualquiera).");
    return;
  }
  localStorage.setItem("usuarioActivo", usuario);
  window.location.href = "categorias.html";
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

/* ========= CATEGORÍAS ========= */
function cargarCategorias() {
  const usuario = ensureAuthOrRedirect();
  if (!usuario) return;

  seedIfNeeded();
  const cont = document.getElementById("listaCategorias");
  const categorias = JSON.parse(localStorage.getItem("categorias")) || [];

  cont.innerHTML = "";
  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.innerText = cat;
    btn.onclick = () => {
      localStorage.setItem("categoriaSeleccionada", cat);
      window.location.href = "lugares.html";
    };
    cont.appendChild(btn);
    cont.appendChild(document.createElement("br"));
  });
}

/* ========= LUGARES ========= */
function cargarLugares() {
  const usuario = ensureAuthOrRedirect();
  if (!usuario) return;

  seedIfNeeded();
  const cat = localStorage.getItem("categoriaSeleccionada");
  const titulo = document.getElementById("tituloCategoria");
  titulo.innerText = "Lugares - " + cat;

  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const lista = document.getElementById("listaLugares");

  const filtrados = lugares.filter(l => l.categoria === cat);
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

  document.getElementById("tituloLugar").innerText = "Reseñas — " + lugarNombre;

  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  mostrarReseñasLugar(lugarId);
  calcularPromedioLugar(lugarId);
}

function mostrarReseñasLugar(idLugar) {
  const ul = document.getElementById("listaReseñas");
  const delLugar = reseñasCache.filter(r => r.idLugar === idLugar);

  ul.innerHTML = "";
  delLugar.forEach((r, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${r.usuario}</b>: "${r.comentario}" ⭐${r.calificacion}
      <button onclick="editarReseña(${idLugar}, ${idx})">Editar</button>
      <button onclick="eliminarReseña(${idLugar}, ${idx})">Eliminar</button>`;
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

  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  reseñasCache.push({ idLugar, usuario, comentario, calificacion: calif });
  localStorage.setItem("reseñas", JSON.stringify(reseñasCache));

  document.getElementById("comentario").value = "";
  document.getElementById("calificacion").value = "";

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
    p.innerText = "Promedio: — (sin reseñas)";
    c.innerText = "Total de reseñas: 0";
    return;
  }

  const total = delLugar.reduce((sum, r) => sum + r.calificacion, 0);
  const promedio = total / delLugar.length;

  p.innerText = "Promedio: " + promedio.toFixed(1);
  c.innerText = "Total de reseñas: " + delLugar.length;
}

function irLugares() {
  window.location.href = "lugares.html";
}

/* ========= REPORTES ========= */
function listarGlobal() {
  const ul = document.getElementById("listadoGlobal");
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];

  ul.innerHTML = "";
  reseñasCache.forEach((r, i) => {
    ul.innerHTML += `<li>ID:${i} — ${r.usuario}: "${r.comentario}" ⭐${r.calificacion}</li>`;
  });
}

function buscarPorID() {
  const id = parseInt(document.getElementById("buscarID").value);
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];

  const res = reseñasCache[id];
  document.getElementById("resultadoBusqueda").innerText =
    res ? `${res.usuario} "${res.comentario}" ⭐${res.calificacion}` : "No existe.";
}

function filtrarRango() {
  const min = parseInt(document.getElementById("min").value);
  const max = parseInt(document.getElementById("max").value);
  const ul = document.getElementById("resultadoRango");

  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  ul.innerHTML = "";

  reseñasCache
    .filter(r => r.calificacion >= min && r.calificacion <= max)
    .forEach(r => {
      ul.innerHTML += `<li>${r.usuario}: "${r.comentario}" ⭐${r.calificacion}</li>`;
    });
}

/* ========= DISPATCH ========= */
window.onload = () => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("categorias.html")) cargarCategorias();
  if (path.endsWith("lugares.html")) cargarLugares();
  if (path.endsWith("reseñas.html")) cargarReseñasPorLugar();
  if (path.endsWith("reportes.html")) {
    ensureAuthOrRedirect();
    listarGlobal();
  }
  if (path.endsWith("index.html")) seedIfNeeded();
};