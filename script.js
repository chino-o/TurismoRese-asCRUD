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
  
  // === INICIO DE NUEVA LÓGICA DE UNICIDAD CON SUFIJO (Matias, Matias_2, etc.) ===
  let nombreUsuarioFinal = nuevoUsuario;
  let indiceDuplicado = 1;

  // Chequeo insensible a mayúsculas/minúsculas para encontrar si el nombre base ya existe
  while (usuarios.some(u => u.nombre.toLowerCase() === nombreUsuarioFinal.toLowerCase())) {
      indiceDuplicado++;
      // Si ya existe 'matias', el próximo será 'matias_2'
      nombreUsuarioFinal = `${nuevoUsuario}_${indiceDuplicado}`;
  }
  // === FIN DE NUEVA LÓGICA DE UNICIDAD CON SUFIJO ===

  const maxId = usuarios.reduce((max, u) => (typeof u.id === "number" && u.id > max ? u.id : max), 0);
  const nuevoId = maxId + 1;
  
  usuarios.push({
    id: nuevoId,
    nombre: nombreUsuarioFinal, // <--- Se usa el nombre final único
    clave: nuevaClave,
    fechaRegistro: new Date().toISOString() });
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  alert(`¡Registro exitoso! Tu nombre de usuario es: ${nombreUsuarioFinal}. Ahora puedes iniciar sesión.`);
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
    window.location.href = "BDadmin.html";
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
    calificacion: calif,
    fecha: new Date().toISOString() // Guardar fecha de creación
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
  const tbody = document.getElementById("listadoGlobal");
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const usuarios = normalizeUsuariosIds();
  const totalReseñasEl = document.getElementById("totalReseñas");

  if (totalReseñasEl) totalReseñasEl.innerText = reseñasCache.length;

  if (!tbody) return;
  tbody.innerHTML = "";
  reseñasCache.forEach((r, i) => {
    const usuarioObj = usuarios.find(u => u.nombre.toLowerCase() === r.usuario.toLowerCase());
    const userId = usuarioObj ? usuarioObj.id : 'N/A';
    const lugar = lugares.find(l => l.id === r.idLugar);
    const nombreLugar = lugar ? lugar.nombre : "Lugar desconocido";
    const fechaFormateada = r.fecha ? new Date(r.fecha).toLocaleDateString() : 'Sin fecha';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${userId}</td>
      <td>${r.usuario}</td>
      <td>${nombreLugar}</td>
      <td>${r.comentario}</td>
      <td>${'⭐'.repeat(r.calificacion)} (${r.calificacion})</td>
      <td>${fechaFormateada}</td>
      <td><button class="btn-edit" onclick="editarReseñaGlobal(${i})">Editar</button> <button class="btn-danger" onclick="eliminarReseñaGlobal(${i})">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function buscarPorUsuario() {
  const input = document.getElementById("buscarUsuario").value.trim().toLowerCase();
  const resultadoTbody = document.getElementById("resultadoBusqueda");

  if (!input) {
    resultadoTbody.innerHTML = `<tr><td colspan="6">Por favor, escribe un nombre de usuario o un ID.</td></tr>`;
    return;
  }

  const reseñas = JSON.parse(localStorage.getItem("reseñas")) || [];
  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const usuarios = normalizeUsuariosIds();

  const usuarioEncontrado = usuarios.find(u =>
    u.nombre.toLowerCase() === input || String(u.id) === input
  );

  if (!usuarioEncontrado) {
    resultadoTbody.innerHTML = `<tr><td colspan="6">No se encontró un usuario con ese nombre o ID.</td></tr>`;
    return;
  }

  // Mapeamos las reseñas para incluir su índice original antes de filtrar
  const reseñasConIndice = reseñas.map((r, index) => ({ ...r, originalIndex: index }));
  const filtradas = reseñasConIndice.filter(r => r.usuario.toLowerCase() === usuarioEncontrado.nombre.toLowerCase());
  
  let htmlResultado = `<tr><td colspan="6"><b>Usuario:</b> ${usuarioEncontrado.nombre} (ID: ${usuarioEncontrado.id})</td></tr>`;
  if (filtradas.length === 0) {
    htmlResultado += `<tr><td colspan="7">Este usuario no tiene reseñas.</td></tr>`;
    resultadoTbody.innerHTML = htmlResultado;
    return;
  }

  // Encabezados para la tabla de resultados
  htmlResultado += `
    <tr style="background-color: #e9ecef;">
        <th>ID Usuario</th>
        <th>Lugar</th>
        <th colspan="2">Comentario</th>
        <th>Calificación</th>
        <th>Fecha</th>
        <th>Acciones</th>
    </tr>
  `;

  htmlResultado += filtradas.map(r => {
    const lugar = lugares.find(l => l.id === r.idLugar);
    const nombreLugar = lugar ? lugar.nombre : "Lugar desconocido";
    const fechaFormateada = r.fecha ? new Date(r.fecha).toLocaleDateString() : 'Sin fecha';
    // Usamos el índice original para los botones de editar/eliminar
    const buttonsHTML = `
      <button class="btn-edit" onclick="editarReseñaGlobal(${r.originalIndex})">Editar</button>
      <button class="btn-danger" onclick="eliminarReseñaGlobal(${r.originalIndex})">Eliminar</button>
    `;
    return `
      <tr>
        <td>${usuarioEncontrado.id}</td>
        <td>${nombreLugar}</td>
        <td colspan="2">${r.comentario}</td>
        <td>${'⭐'.repeat(r.calificacion)} (${r.calificacion})</td>
        <td>${fechaFormateada}</td>
        <td>${buttonsHTML}</td>
      </tr>
    `;
  }).join("");

  resultadoTbody.innerHTML = htmlResultado;
}

function filtrarRango() {
  const min = parseInt(document.getElementById("min").value);
  const max = parseInt(document.getElementById("max").value);
  const tbody = document.getElementById("resultadoRango");

  if (!tbody) return;
  tbody.innerHTML = "";

  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const usuarios = normalizeUsuariosIds();

  const reseñasConIndice = reseñasCache.map((r, index) => ({ ...r, originalIndex: index }));

  const filtradas = reseñasConIndice
    .filter(r => r.calificacion >= min && r.calificacion <= max);
  
  if (filtradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No hay reseñas en ese rango de calificación.</td></tr>`;
    return;
  }

  filtradas.forEach(r => {
    const usuarioObj = usuarios.find(u => u.nombre.toLowerCase() === r.usuario.toLowerCase());
    const userId = usuarioObj ? usuarioObj.id : 'N/A';
    const lugar = lugares.find(l => l.id === r.idLugar);
    const fechaFormateada = r.fecha ? new Date(r.fecha).toLocaleDateString() : 'Sin fecha';

    tbody.innerHTML += `
      <tr>
        <td>${userId}</td>
        <td>${r.usuario}</td>
        <td>${lugar?.nombre || 'N/A'}</td>
        <td>${r.comentario}</td>
        <td>${'⭐'.repeat(r.calificacion)} (${r.calificacion})</td>
        <td>${fechaFormateada}</td>
      </tr>`;
  });
}

function filtrarPorFecha() {
  const fechaInicioStr = document.getElementById("fechaInicio").value;
  const fechaFinStr = document.getElementById("fechaFin").value;
  const tbody = document.getElementById("resultadoFechas");

  if (!tbody) return;
  tbody.innerHTML = "";

  if (!fechaInicioStr || !fechaFinStr) {
    tbody.innerHTML = `<tr><td colspan="6">Por favor, selecciona una fecha de inicio y de fin.</td></tr>`;
    return;
  }

  // Ajustar la fecha de fin para que incluya todo el día
  const fechaInicio = new Date(fechaInicioStr);
  const fechaFin = new Date(fechaFinStr);
  fechaFin.setHours(23, 59, 59, 999);

  const reseñas = JSON.parse(localStorage.getItem("reseñas")) || [];
  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const usuarios = normalizeUsuariosIds();

  const reseñasConIndice = reseñas.map((r, index) => ({ ...r, originalIndex: index }));

  const filtradas = reseñasConIndice.filter(r => {
    if (!r.fecha) return false;
    const fechaReseña = new Date(r.fecha);
    return fechaReseña >= fechaInicio && fechaReseña <= fechaFin;
  });

  if (filtradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No se encontraron reseñas en ese rango de fechas.</td></tr>`;
    return;
  }

  filtradas.forEach(r => {
    const usuarioObj = usuarios.find(u => u.nombre.toLowerCase() === r.usuario.toLowerCase());
    const userId = usuarioObj ? usuarioObj.id : 'N/A';
    const lugar = lugares.find(l => l.id === r.idLugar);
    tbody.innerHTML += `
      <tr>
        <td>${userId}</td>
        <td>${r.usuario}</td>
        <td>${lugar?.nombre || 'N/A'}</td>
        <td>"${r.comentario}"</td>
        <td>${'⭐'.repeat(r.calificacion)} (${r.calificacion})</td>
        <td>${new Date(r.fecha).toLocaleDateString()}</td>
      </tr>`;
  });
}

function editarReseñaGlobal(idx) {
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  const r = reseñasCache[idx];
  if (!r) return;

  const nuevoComentario = prompt("Nuevo comentario:", r.comentario) ?? r.comentario;
  const nuevaCalif = parseInt(prompt("Nueva calificación (1-5):", r.calificacion)) || r.calificacion;

  reseñasCache[idx] = { ...r, comentario: nuevoComentario, calificacion: nuevaCalif, fecha: r.fecha }; // Preservar fecha
  localStorage.setItem("reseñas", JSON.stringify(reseñasCache));
  listarGlobal();
}

function eliminarReseñaGlobal(idx) {
  reseñasCache = JSON.parse(localStorage.getItem("reseñas")) || [];
  reseñasCache.splice(idx, 1);
  localStorage.setItem("reseñas", JSON.stringify(reseñasCache));
  listarGlobal();
}

/* ========= NAVEGACIÓN POR LUGAR EN REPORTES ========= */

function iniciarNavegacionPorLugar() {
  const navContainer = document.getElementById("navegacionPorLugar");
  if (!navContainer) return;

  const categorias = JSON.parse(localStorage.getItem("categorias")) || [];

  let html = "<h4>Categorías</h4><div>";
  categorias.forEach(cat => {
    // Usamos comillas simples y dobles para pasar el string de forma segura
    html += `<button onclick="mostrarLugaresReportes('${cat}')">${cat}</button>`;
  });
  html += "</div>";

  navContainer.innerHTML = html;
}

function mostrarLugaresReportes(categoria) {
  const lugaresContainer = document.getElementById("lugaresReportesContainer");
  const reseñasContainer = document.getElementById("reseñasReportesContainer");
  if (!lugaresContainer || !reseñasContainer) return;

  // Limpiamos las reseñas anteriores al elegir una nueva categoría
  reseñasContainer.innerHTML = "";

  const lugares = JSON.parse(localStorage.getItem("lugares")) || [];
  const filtrados = lugares.filter(l => l.categoria === categoria);

  let html = `<h4>Lugares de "${categoria}"</h4><div>`;
  filtrados.forEach(lugar => {
    html += `<button onclick="mostrarReseñasReportes(${lugar.id}, '${lugar.nombre}')">${lugar.nombre}</button>`;
  });
  html += "</div>";

  lugaresContainer.innerHTML = html;
}

function mostrarReseñasReportes(lugarId, lugarNombre) {
  const reseñasContainer = document.getElementById("reseñasReportesContainer");
  if (!reseñasContainer) return;

  const reseñas = JSON.parse(localStorage.getItem("reseñas")) || [];
  const usuarios = normalizeUsuariosIds();
  const reseñasConIndice = reseñas.map((r, index) => ({ ...r, originalIndex: index }));
  const filtradas = reseñasConIndice.filter(r => r.idLugar === lugarId);

  let html = `<tr><td colspan="6" style="background-color: #e9ecef;"><b>Reseñas de "${lugarNombre}"</b></td></tr>`;

  if (filtradas.length === 0) {
    html += `<tr><td colspan="7">Este lugar aún no tiene reseñas.</td></tr>`;
  } else {
    html += `
        <tr style="background-color: #f8f9fa;">
            <th>ID Usuario</th>
            <th>Usuario</th>
            <th>Comentario</th>
            <th>Calificación</th>
            <th>Fecha</th>
            <th>Acciones</th>
        </tr>
    `;
    filtradas.forEach(r => {
      const usuarioObj = usuarios.find(u => u.nombre.toLowerCase() === r.usuario.toLowerCase());
      const userId = usuarioObj ? usuarioObj.id : 'N/A';
      const fechaFormateada = r.fecha ? new Date(r.fecha).toLocaleDateString() : 'Sin fecha';
      html += `
        <tr>
            <td>${userId}</td>
            <td>${r.usuario}</td>
            <td>${r.comentario}</td>
            <td>${'⭐'.repeat(r.calificacion)} (${r.calificacion})</td>
            <td>${fechaFormateada}</td>
            <td>
                <button class="btn-edit" onclick="editarReseñaGlobal(${r.originalIndex})">Editar</button>
                <button class="btn-danger" onclick="eliminarReseñaGlobal(${r.originalIndex})">Eliminar</button>
            </td>
        </tr>`;
    });
  }
  reseñasContainer.innerHTML = html;
}

function listarUsuariosRegistrados() {
  const tbody = document.getElementById("listaUsuarios");
  const totalUsuariosEl = document.getElementById("totalUsuarios");
  if (!tbody || !totalUsuariosEl) return;

  const usuarios = normalizeUsuariosIds();
  totalUsuariosEl.innerText = usuarios.length;
  tbody.innerHTML = "";

  usuarios.forEach(u => {
    // Para usuarios antiguos que no tengan fecha de registro
    const fechaFormateada = u.fechaRegistro
      ? new Date(u.fechaRegistro).toLocaleDateString()
      : 'N/A';

    tbody.innerHTML += `
      <tr>
        <td>${u.id}</td>
        <td>${u.nombre}</td>
        <td>${fechaFormateada}</td>
      </tr>`;
  });
}
/* ========= DISPATCH ========= */
window.onload = () => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("categorias.html")) cargarCategorias();
  if (path.endsWith("reseñas.html")) cargarReseñasPorLugar();
  if (path.endsWith("bdadmin.html")) {
    const usuario = ensureAuthOrRedirect();
    if (!usuario) return;
    if (usuario.toLowerCase() !== "admin") {
      alert("Acceso restringido: solo el administrador puede entrar a la Base de Datos.");
      window.location.href = "categorias.html";
      return;
    }
    listarGlobal();
    listarUsuariosRegistrados();
    iniciarNavegacionPorLugar();
  }
  if (path.endsWith("index.html")) seedIfNeeded();

};