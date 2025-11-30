/* ========= IMPORTACIONES DE FIREBASE ========= */
import { db, collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc, setDoc } from './firebase.js';

/* ========= CONFIGURACIÓN DE MIGRACIÓN (SOLO PARA ACTUALIZAR DB) ========= */
// Esta lista se usa UNA VEZ para actualizar tu base de datos con los nombres y fotos correctas.
// Después de que cargue la página, los datos vivirán en Firebase.
const DATOS_ACTUALIZADOS = [
  // Cafeterías
  { id: 1, nombre: "Cafetería Estado", categoria: "Cafeterías", ubicacion: "Calle Estado, Rancagua", foto: "lugaresimagenes/CafeteriaEstado.jpg" },
  { id: 2, nombre: "Coffee Street", categoria: "Cafeterías", ubicacion: "Paseo Independencia", foto: "lugaresimagenes/Coffee Street.jpg" },
  { id: 3, nombre: "Filippo", categoria: "Cafeterías", ubicacion: "Mall Plaza América", foto: "lugaresimagenes/Filippo.jpg" },
  
  // Librerías
  { id: 7, nombre: "Caza del Libro", categoria: "Librerías", ubicacion: "Calle Bueras", foto: "lugaresimagenes/CazaDelLibro.jpg" },
  { id: 8, nombre: "Librería Cervantes", categoria: "Librerías", ubicacion: "Calle Campos", foto: "lugaresimagenes/Librería Cervantes.jpg" },
  
  // Aire Libre
  { id: 10, nombre: "Parque Koke", categoria: "Aire Libre", ubicacion: "Sector Norte", foto: "lugaresimagenes/ParqueKoke.jpg" },
  { id: 11, nombre: "Polideportivo Parque Lourdes", categoria: "Aire Libre", ubicacion: "Av. Diagonal Doñihue", foto: "lugaresimagenes/Polideportivo.jpg" },

  // Entretenimiento
  { id: 12, nombre: "Kid Center", categoria: "Entretenimiento", ubicacion: "Miguel Ramírez 184, Rancagua", foto: "lugaresimagenes/KidCenter.jpg" },
  { id: 13, nombre: "Pool Rancagua", categoria: "Entretenimiento", ubicacion: "Sta. María 320, Rancagua", foto: "lugaresimagenes/PoolRancagua.jpg" },
  { id: 14, nombre: "Cinemark Open Plaza", categoria: "Entretenimiento", ubicacion: "Teniente Coronel José Bernardo Cuevas 405, Rancagua", foto: "lugaresimagenes/CineMarkOpenPlaza.jpg" }
];

const SEED_CATEGORIAS = ["Cafeterías", "Librerías", "Aire Libre", "Entretenimiento"];

// Clave para saber si ya actualizamos los datos nuevos
const MIGRACION_KEY = "v8_fix_nombres_imagenes"; 

async function seedIfNeeded() {
  // Si la migración más reciente ya se ejecutó, no hacemos nada.
  if (localStorage.getItem(MIGRACION_KEY)) return;

  console.log("Iniciando migración de datos (v8)...");
  try {
    // 1. Forzamos la actualización de la lista de categorías en el navegador.
    localStorage.setItem("categorias", JSON.stringify(SEED_CATEGORIAS));
    console.log("Lista de categorías actualizada en localStorage.");

    // 2. Actualizamos los lugares en Firebase.
    for (const lugar of DATOS_ACTUALIZADOS) {
      // Usamos 'merge: true' para actualizar nombre y foto sin borrar otros datos si existieran
      await setDoc(doc(db, "lugares", String(lugar.id)), lugar, { merge: true });
      console.log(`Lugar actualizado: ${lugar.nombre}`);
    }
    localStorage.setItem(MIGRACION_KEY, "true");
    alert("¡Base de datos actualizada con los nuevos lugares y fotos!");
  } catch (e) { 
    console.error("Error en migración:", e);
  }
}

/* ========= VARIABLES DEL CARRUSEL ========= */
let carruselLugares = []; 
let carruselIndex = 0;

/* ========= LOGIN Y REGISTRO ========= */
async function iniciarSesion() {
  seedIfNeeded();
  const nombreUsuario = document.getElementById("nombreUsuario")?.value?.trim();
  const clave = document.getElementById("claveUsuario")?.value?.trim();
  if (!nombreUsuario || !clave) { alert("Faltan datos."); return; }

  try {
    const claveHash = await encriptarPassword(clave);
    const q = query(collection(db, "usuarios"), where("nombre", "==", nombreUsuario), where("clave", "==", claveHash));
    const snap = await getDocs(q);

    if (!snap.empty) {
      localStorage.setItem("usuarioActivo", nombreUsuario);
      window.location.href = "categorias.html";
    } else {
      alert("Credenciales incorrectas.");
    }
  } catch (e) { console.error(e); alert("Error al conectar."); }
}

async function registrarUsuario() {
  const nombre = document.getElementById("nuevoUsuario")?.value?.trim();
  const clave = document.getElementById("nuevaClave")?.value?.trim();
  if (!nombre || !clave) { alert("Completa los campos."); return; }

  try {
    const snap = await getDocs(collection(db, "usuarios"));
    const users = [];
    snap.forEach(d => users.push(d.data()));

    let nombreFinal = nombre;
    let i = 1;
    while (users.some(u => u.nombre.toLowerCase() === nombreFinal.toLowerCase())) {
        i++; nombreFinal = `${nombre}_${i}`;
    }

    let maxId = users.reduce((max, u) => (u.idNum > max ? u.idNum : max), 0);
    const claveHash = await encriptarPassword(clave);

    await addDoc(collection(db, "usuarios"), {
      idNum: maxId + 1,
      nombre: nombreFinal,
      clave: claveHash,
      fechaRegistro: new Date().toISOString()
    });

    alert(`¡Registro exitoso! Tu usuario es: ${nombreFinal}.`);
    window.location.href = "index.html";
  } catch (e) { console.error(e); alert("Error al registrar."); }
}

async function encriptarPassword(texto) {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function cerrarSesion() { localStorage.removeItem("usuarioActivo"); window.location.href = "index.html"; }

/* ========= NAVEGACIÓN ========= */
function ensureAuthOrRedirect() {
  const u = localStorage.getItem("usuarioActivo");
  if(!u) { window.location.href="index.html"; return null; }
  const el = document.getElementById("usuarioActivo");
  if(el) el.innerText = "Usuario: " + u;
  return u;
}

function abrirBD() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) { alert("Inicia sesión."); return; }
  if (usuario.toLowerCase() === "admin") { window.location.href = "BDadmin.html"; } 
  else { alert("Acceso restringido."); }
}

function configurarBotonBD(u) {
  const btn = document.getElementById("btnReportes");
  if(btn && u==="admin") { 
    btn.style.display="inline-block"; 
    btn.onclick=()=>window.location.href="BDadmin.html"; 
  }
}

/* ========= CARRUSEL (CLIENTE) ========= */
function cargarCategorias() {
  if(!ensureAuthOrRedirect()) return;
  seedIfNeeded();
  configurarBotonBD(localStorage.getItem("usuarioActivo"));

  const cont = document.getElementById("listaCategorias");
  cont.innerHTML = "";
  // Usamos una lista segura de categorías para evitar errores si el LocalStorage está vacío
  const cats = JSON.parse(localStorage.getItem("categorias")) || SEED_CATEGORIAS;
  
  cats.forEach(c => {
    const b = document.createElement("button");
    b.innerText = c; 
    b.onclick = () => prepararCarrusel(c); 
    cont.appendChild(b); cont.appendChild(document.createElement("br"));
  });
}

async function prepararCarrusel(categoria) {
  const lista = document.getElementById("listaLugares");
  const tit = document.getElementById("tituloLugares");
  tit.innerText = "Lugares de " + categoria;
  lista.innerHTML = "Cargando...";

  const q = query(collection(db, "lugares"), where("categoria", "==", categoria));
  const snap = await getDocs(q);

  carruselLugares = [];
  carruselIndex = 0;

  if (snap.empty) { lista.innerHTML = "<p>No hay lugares disponibles.</p>"; return; }

  snap.forEach(d => carruselLugares.push(d.data()));
  
  renderizarCarrusel();
}

function renderizarCarrusel() {
  const lista = document.getElementById("listaLugares");
  const lugar = carruselLugares[carruselIndex];

  if (!lugar) return;

  // Usamos la ruta de la foto que viene de la BD (ej: "lugaresimagenes/Filippo.jpg")
  // Si falla, muestra un placeholder gris.
  const rutaImagen = lugar.foto ? lugar.foto : "https://via.placeholder.com/300?text=Sin+Foto";

  // Estilos Inline
  const styleContainer = "display:flex; align-items:center; justify-content:center; gap:15px; background:#fff; padding:20px; border:1px solid #ddd; border-radius:10px; margin:auto; max-width:600px;";
  const styleImg = "width:250px; height:180px; object-fit:cover; border-radius:8px;";
  const styleInfo = "text-align:left; flex:1;";
  const styleBtnNav = "background:#333; color:white; border:none; padding:15px; border-radius:50%; cursor:pointer; font-size:18px;";
  const styleBtnAction = "background:#007bff; color:white; border:none; padding:10px; width:100%; border-radius:5px; cursor:pointer; margin-top:10px;";

  lista.innerHTML = `
    <div style="${styleContainer}">
      <button onclick="cambiarLugar(-1)" style="${styleBtnNav}">&#10094;</button>
      
      <div style="text-align:center;">
        <img src="${rutaImagen}" style="${styleImg}" onerror="this.src='https://via.placeholder.com/300?text=Imagen+No+Encontrada'">
        
        <div style="${styleInfo}">
          <h3 style="margin:10px 0; color:#333;">${lugar.nombre}</h3>
          <p style="margin:5px 0; color:#666; font-size:14px;">📍 ${lugar.ubicacion || 'Sin dirección'}</p>
          <p style="font-size:12px; color:#999;">${carruselIndex + 1} / ${carruselLugares.length}</p>
          <button onclick="irAReseñas(${lugar.id}, '${lugar.nombre}')" style="${styleBtnAction}">Ver y Calificar</button>
        </div>
      </div>

      <button onclick="cambiarLugar(1)" style="${styleBtnNav}">&#10095;</button>
    </div>
  `;
}

function cambiarLugar(direccion) {
  carruselIndex += direccion;
  if (carruselIndex < 0) carruselIndex = carruselLugares.length - 1;
  if (carruselIndex >= carruselLugares.length) carruselIndex = 0;
  renderizarCarrusel();
}

function irAReseñas(id, nombre) {
  localStorage.setItem("lugarSeleccionadoId", id); 
  localStorage.setItem("lugarSeleccionadoNombre", nombre); 
  window.location.href="reseñas.html"; 
}

function irLugares() { window.location.href = "categorias.html"; }
function irCategorias() { window.location.href = "categorias.html"; }

/* ========= GESTIÓN DE LUGARES (ADMIN) ========= */
async function listarLugaresAdmin() {
  const tbody = document.getElementById("listaLugaresAdmin");
  if(!tbody) return;
  tbody.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";

  const snap = await getDocs(collection(db, "lugares"));
  let arr = [];
  snap.forEach(d => arr.push({ uid: d.id, ...d.data() }));
  arr.sort((a,b) => (a.id || 9999) - (b.id || 9999));

  tbody.innerHTML = "";
  let contador = 1; // 1. Inicia el contador para el ID secuencial
  arr.forEach(l => {
    // Previsualización pequeña de la imagen en la tabla admin
    const imgSmall = l.foto ? `<img src="${l.foto}" style="width:30px; height:30px; object-fit:cover;">` : '';

    tbody.innerHTML += `
      <tr data-id-real="${l.uid}">
        <td>${contador}</td>
        <td>${l.nombre} <br> ${imgSmall}</td>
        <td>${l.categoria}</td>
        <td>${l.ubicacion || '-'}</td>
        <td>
            <button class="btn-edit" onclick="editarLugar('${l.uid}')">Editar</button>
            <button class="btn-danger" onclick="eliminarLugar('${l.uid}', '${l.nombre}')">Eliminar</button>
        </td>
      </tr>`;
    contador++; // 2. Incrementa el contador para la siguiente fila
  });
}

async function crearLugar() {
  try {
    const nombre = prompt("Nombre del Lugar:");
    if (!nombre) return;
    const categoria = prompt("Categoría:"); if (!categoria) return;
    const ubicacion = prompt("Ubicación:"); if (!ubicacion) return;
    const foto = prompt("Ruta Foto (Ej: lugaresimagenes/foto.jpg):");

    const snap = await getDocs(collection(db, "lugares"));
    let maxId = 0;
    snap.forEach(d => {
        const data = d.data();
        if (data.id && typeof data.id === 'number' && data.id > maxId) maxId = data.id;
    });

    await addDoc(collection(db, "lugares"), {
        id: maxId + 1, nombre, categoria, ubicacion, foto: foto || ""
    });

    alert("Creado"); listarLugaresAdmin();
  } catch (e) { console.error(e); alert("Error al crear."); }
}

async function editarLugar(uid) {
  try {
    const ref = doc(db, "lugares", uid);
    const snap = await getDoc(ref);
    if(!snap.exists()) return;
    const d = snap.data();
    
    const n = prompt("Nombre:", d.nombre); if(n===null) return;
    const u = prompt("Ubicación:", d.ubicacion); if(u===null) return;
    const f = prompt("Ruta Foto:", d.foto || ""); if(f===null) return;

    if(n.trim()) {
      await updateDoc(ref, { nombre: n, ubicacion: u, foto: f });
      alert("Actualizado"); listarLugaresAdmin(); 
    } else { alert("Nombre obligatorio"); }
  } catch(e) { alert("Error al editar"); }
}

async function eliminarLugar(uid, nombre) {
    if(confirm(`¿Eliminar "${nombre}"?`)) {
        try { await deleteDoc(doc(db, "lugares", uid)); alert("Eliminado"); listarLugaresAdmin(); }
        catch(e) { alert("Error"); }
    }
}

/* ========= ADMIN: REPORTES Y USUARIOS ========= */
async function listarUsuariosRegistrados() {
  const tbody = document.getElementById("listaUsuarios");
  const totalEl = document.getElementById("totalUsuarios");
  if(!tbody) return;
  const snap = await getDocs(collection(db, "usuarios"));
  let usuarios = [];
  snap.forEach(d => usuarios.push({ uid: d.id, ...d.data() }));
  // Ordenamos los usuarios por su idNum para que se muestren en orden
  usuarios.sort((a, b) => (a.idNum || 0) - (b.idNum || 0));

  tbody.innerHTML = "";
  usuarios.forEach(u => {
    let btn = `<button class="btn-danger" onclick="eliminarUsuario('${u.uid}', '${u.nombre}')">X</button>`;
    if(u.nombre.toLowerCase() === "admin") btn = "";
    tbody.innerHTML += `<tr data-id-real="${u.uid}">
                          <td>${u.idNum || '-'}</td>
                          <td>${u.nombre}</td>
                          <td>${u.fechaRegistro?new Date(u.fechaRegistro).toLocaleDateString():'-'}</td>
                          <td style='text-align:center'>${btn}</td>
                        </tr>`;
  });
  if(totalEl) totalEl.innerText = usuarios.length;
}

async function eliminarUsuario(uid, nombre) {
    if(confirm(`¿Borrar usuario "${nombre}"?`)) {
        try { await deleteDoc(doc(db, "usuarios", uid)); alert("Eliminado"); listarUsuariosRegistrados(); }
        catch(e) { alert("Error"); }
    }
}

async function listarGlobal() {
  const tbody = document.getElementById("listadoGlobal");
  const totalEl = document.getElementById("totalReseñas");
  if(!tbody) return;
  const snap = await getDocs(collection(db, "reseñas"));
  
  // Mapeos para obtener nombres de lugares e ID de usuarios
  const snapLug = await getDocs(collection(db, "lugares"));
  const mapaLugares = {};
  snapLug.forEach(d => mapaLugares[d.data().id] = d.data().nombre);

  const snapUsuarios = await getDocs(collection(db, "usuarios"));
  const mapaUsuarios = {};
  snapUsuarios.forEach(d => mapaUsuarios[d.data().nombre.toLowerCase()] = d.data().idNum);

  tbody.innerHTML = "";
  let totalReseñas = 0;
  snap.forEach(d => {
    totalReseñas++;
    const r = d.data();
    const nombreLugar = mapaLugares[r.idLugar] || r.idLugar;
    const idUsuario = mapaUsuarios[r.usuario.toLowerCase()] || '-'; // Obtenemos el idNum del usuario
    tbody.innerHTML += `<tr data-id-real="${d.id}">
                          <td>${idUsuario}</td>
                          <td>${r.usuario}</td>
                          <td>${nombreLugar}</td>
                          <td>${r.comentario}</td>
                          <td>⭐${r.calificacion}</td>
                          <td>${r.fecha?new Date(r.fecha).toLocaleDateString():'-'}</td>
                          <td><button class="btn-edit" onclick="editarReseñaGlobal('${d.id}')">Edit</button><button class="btn-danger" onclick="eliminarReseñaGlobal('${d.id}')">X</button></td>
                        </tr>`;
  });
  if(totalEl) totalEl.innerText = totalReseñas;
}

async function editarReseñaGlobal(id) {
  try {
    const ref = doc(db, "reseñas", id);
    const snap = await getDoc(ref);
    if(!snap.exists()) return;
    const d = snap.data();
    const txt = prompt("Comentario:", d.comentario); if(!txt) return;
    const cal = prompt("Calificación:", d.calificacion); if(!cal) return;
    await updateDoc(ref, { comentario: txt, calificacion: parseInt(cal) });
    alert("Actualizado"); listarGlobal();
  } catch(e) { alert("Error"); }
}

async function eliminarReseñaGlobal(id) {
  if(confirm("¿Borrar?")) { await deleteDoc(doc(db, "reseñas", id)); listarGlobal(); }
}

/* ========= RESEÑAS (CLIENTE) ========= */
async function agregarReseña() {
  const txt = document.getElementById("comentario").value;
  const cal = parseInt(document.getElementById("calificacion").value);
  const user = localStorage.getItem("usuarioActivo");
  const idLugar = parseInt(localStorage.getItem("lugarSeleccionadoId"));
  if(!txt || !(cal>=1 && cal<=5)) { alert("Datos incorrectos"); return; }
  await addDoc(collection(db, "reseñas"), { idLugar:idLugar, usuario:user, comentario:txt, calificacion:cal, fecha:new Date().toISOString() });
  alert("¡Guardado!"); document.getElementById("comentario").value="";
  cargarReseñasPorLugar();
}

async function cargarReseñasPorLugar() {
  if(!ensureAuthOrRedirect()) return;
  const lid = parseInt(localStorage.getItem("lugarSeleccionadoId"));
  const lnom = localStorage.getItem("lugarSeleccionadoNombre");
  document.getElementById("tituloLugar").innerText = "Reseñas — " + lnom;
  const ul = document.getElementById("listaReseñas");
  ul.innerHTML = "Cargando...";
  const q = query(collection(db, "reseñas"), where("idLugar", "==", lid));
  const snap = await getDocs(q);
  ul.innerHTML = "";
  let tot=0, c=0;
  snap.forEach(d => { const r=d.data(); c++; tot+=r.calificacion; ul.innerHTML+=`<li><b>${r.usuario}</b>: "${r.comentario}" ⭐${r.calificacion}</li>`; });
  document.getElementById("promedio").innerText = "Promedio: " + (c?(tot/c).toFixed(1):"—");
  document.getElementById("conteo").innerText = "Total: "+c;
}

/* ========= BÚSQUEDA Y FILTROS ========= */
async function buscarPorUsuario() {
  const inp = document.getElementById("buscarUsuario").value.trim().toLowerCase();
  const tbody = document.getElementById("resultadoBusqueda");
  if(!tbody || !inp) return;
  tbody.innerHTML="<tr><td colspan='6'>Buscando...</td></tr>";
  const uSnap = await getDocs(collection(db, "usuarios"));
  let names = [];
  uSnap.forEach(d => { const u=d.data(); if(String(u.idNum)===inp || u.nombre.toLowerCase().includes(inp)) names.push(u.nombre.toLowerCase()); });
  const rSnap = await getDocs(collection(db, "reseñas"));
  const lSnap = await getDocs(collection(db, "lugares"));
  const lMap = {}; lSnap.forEach(d => lMap[d.data().id]=d.data().nombre); // Mapa de lugares
  const uMap = {}; uSnap.forEach(d => uMap[d.data().nombre.toLowerCase()] = d.data().idNum); // Mapa de usuarios

  tbody.innerHTML = "";
  let found = false;
  rSnap.forEach(d => {
    const r = d.data();
    if(names.includes(r.usuario.toLowerCase()) || r.usuario.toLowerCase().includes(inp)) {
      found = true;
      const idUsuario = uMap[r.usuario.toLowerCase()] || '-';
      tbody.innerHTML += `<tr data-id-real="${d.id}">
                            <td>${idUsuario}</td>
                            <td>${r.usuario}</td><td>${lMap[r.idLugar]||r.idLugar}</td><td>${r.comentario}</td><td>⭐${r.calificacion}</td><td>${r.fecha?new Date(r.fecha).toLocaleDateString():'-'}</td>
                          </tr>`;
    }
  });
  if(!found) tbody.innerHTML="<tr><td colspan='6'>Sin resultados</td></tr>";
}

async function filtrarRango() {
  const min=parseInt(document.getElementById("min").value)||1, max=parseInt(document.getElementById("max").value)||5;
  const tbody = document.getElementById("resultadoRango");
  tbody.innerHTML="<tr><td colspan='6'>Filtrando...</td></tr>";
  const rSnap = await getDocs(collection(db, "reseñas"));
  const lSnap = await getDocs(collection(db, "lugares"));
  const uSnap = await getDocs(collection(db, "usuarios"));
  const lMap = {}; lSnap.forEach(d => lMap[d.data().id]=d.data().nombre);
  const uMap = {}; uSnap.forEach(d => uMap[d.data().nombre.toLowerCase()] = d.data().idNum);

  tbody.innerHTML = "";
  let found = false;
  rSnap.forEach(d => {
    const r = d.data();
    if(r.calificacion>=min && r.calificacion<=max) {
      found = true;
      const idUsuario = uMap[r.usuario.toLowerCase()] || '-';
      tbody.innerHTML += `<tr data-id-real="${d.id}"><td>${idUsuario}</td><td>${r.usuario}</td><td>${lMap[r.idLugar]||r.idLugar}</td><td>${r.comentario}</td><td>⭐${r.calificacion}</td><td>${r.fecha?new Date(r.fecha).toLocaleDateString():'-'}</td></tr>`;
    }
  });
  if(!found) tbody.innerHTML="<tr><td colspan='6'>Sin resultados</td></tr>";
}

async function filtrarPorFecha() {
  const i=document.getElementById("fechaInicio").value, f=document.getElementById("fechaFin").value;
  const tbody = document.getElementById("resultadoFechas");
  if(!i||!f){alert("Faltan fechas");return;}
  tbody.innerHTML="<tr><td colspan='6'>Filtrando...</td></tr>";
  const di=new Date(i), df=new Date(f); df.setHours(23,59,59);
  const rSnap = await getDocs(collection(db, "reseñas"));
  const lSnap = await getDocs(collection(db, "lugares"));
  const uSnap = await getDocs(collection(db, "usuarios"));
  const lMap = {}; lSnap.forEach(d => lMap[d.data().id]=d.data().nombre);
  const uMap = {}; uSnap.forEach(d => uMap[d.data().nombre.toLowerCase()] = d.data().idNum);

  tbody.innerHTML = "";
  let found = false;
  rSnap.forEach(d => {
    const r = d.data();
    if(r.fecha && new Date(r.fecha)>=di && new Date(r.fecha)<=df) {
      found = true;
      const idUsuario = uMap[r.usuario.toLowerCase()] || '-';
      tbody.innerHTML += `<tr data-id-real="${d.id}"><td>${idUsuario}</td><td>${r.usuario}</td><td>${lMap[r.idLugar]||r.idLugar}</td><td>${r.comentario}</td><td>⭐${r.calificacion}</td><td>${new Date(r.fecha).toLocaleDateString()}</td></tr>`;
    }
  });
  if(!found) tbody.innerHTML="<tr><td colspan='6'>Sin resultados</td></tr>";
}

function iniciarNavegacionPorLugar() {
  const nav = document.getElementById("navegacionPorLugar"); if(!nav) return;
  nav.innerHTML = "<h4>Categoría:</h4>";
  JSON.parse(localStorage.getItem("categorias")).forEach(c => {
    const b = document.createElement("button"); b.innerText=c; b.style.margin="5px"; b.onclick=()=>mostrarLugaresReportes(c); nav.appendChild(b);
  });
}
async function mostrarLugaresReportes(cat) {
  const dl = document.getElementById("lugaresReportesContainer"); dl.innerHTML="Cargando...";
  const q = query(collection(db, "lugares"), where("categoria", "==", cat));
  const snap = await getDocs(q);
  dl.innerHTML = `<h4>Lugares de ${cat}:</h4>`;
  if(snap.empty) { dl.innerHTML+="<p>Vacio</p>"; return; }
  snap.forEach(d => {
    const l = d.data();
    const b = document.createElement("button"); b.innerText=l.nombre; b.style.margin="5px"; b.style.background="#17a2b8"; b.onclick=()=>mostrarReseñasReportes(l.id, l.nombre);
    dl.appendChild(b);
  });
}
async function mostrarReseñasReportes(lid, lnom) {
  const t = document.getElementById("reseñasReportesContainer"); t.innerHTML=`<tr><td colspan='6'>Cargando ${lnom}...</td></tr>`;
  const q = query(collection(db, "reseñas"), where("idLugar", "==", lid));
  const snap = await getDocs(q);
  const uSnap = await getDocs(collection(db, "usuarios"));
  const uMap = {}; uSnap.forEach(d => uMap[d.data().nombre.toLowerCase()] = d.data().idNum);

  t.innerHTML = "";
  if(snap.empty) { t.innerHTML=`<tr><td colspan='6'>Sin reseñas</td></tr>`; return; }
  snap.forEach(d => {
    const r=d.data();
    const idUsuario = uMap[r.usuario.toLowerCase()] || '-';
    t.innerHTML+=`<tr data-id-real="${d.id}"><td>${idUsuario}</td><td>${r.usuario}</td><td>${lnom}</td><td>${r.comentario}</td><td>⭐${r.calificacion}</td><td>${r.fecha?new Date(r.fecha).toLocaleDateString():'-'}</td></tr>`;
  });
}

/* ========= GRÁFICO DE RESEÑAS (ADMIN) ========= */
let miGrafico; // Variable global para guardar la instancia del gráfico

async function mostrarGraficoReseñasPorLugar() {
  const container = document.getElementById('graficoContainer');
  if (!container) return;

  // Si el gráfico ya está visible, lo ocultamos y terminamos.
  if (container.style.display === 'block') {
    container.style.display = 'none';
    return;
  }

  // Si está oculto, lo mostramos y procedemos a generar el gráfico.
  container.style.display = 'block';
  const canvas = document.getElementById('graficoReseñas');
  const ctx = canvas.getContext('2d');

  try {
    // 1. Obtener todos los lugares para mapear ID a Nombre
    const lugaresSnap = await getDocs(collection(db, "lugares"));
    const mapaLugares = {};
    lugaresSnap.forEach(doc => {
      const lugar = doc.data();
      mapaLugares[lugar.id] = lugar.nombre;
    });

    // 2. Obtener todas las reseñas y contarlas por idLugar
    const reseñasSnap = await getDocs(collection(db, "reseñas"));
    const conteoReseñas = {};
    reseñasSnap.forEach(doc => {
      const reseña = doc.data();
      const idLugar = reseña.idLugar;
      conteoReseñas[idLugar] = (conteoReseñas[idLugar] || 0) + 1;
    });

    // 3. Preparar los datos para el gráfico
    const labels = Object.keys(conteoReseñas).map(id => mapaLugares[id] || `Lugar ID: ${id}`);
    const data = Object.values(conteoReseñas);

    // 4. Si ya existe un gráfico, lo destruimos para crear uno nuevo
    if (miGrafico) {
      miGrafico.destroy();
    }

    // 5. Crear el nuevo gráfico de barras
    miGrafico = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad de Reseñas',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    });
  } catch (e) {
    console.error("Error al generar el gráfico:", e);
    container.innerHTML = "<p>Error al cargar los datos para el gráfico.</p>";
  }
}

/* ========= FOOTER DINÁMICO ========= */
function crearFooter() {
  // No agregar el footer en la página de administración
  if (window.location.pathname.includes("BDadmin.html")) {
    return;
  }

  const footer = document.createElement("footer");
  footer.style.backgroundColor = "#333";
  footer.style.color = "#fff";
  footer.style.textAlign = "center";
  footer.style.padding = "20px";
  footer.style.marginTop = "40px";
  footer.style.fontSize = "14px";
  footer.style.width = "100%"; // Asegura que ocupe todo el ancho

  footer.innerHTML = `
    <p>&copy; 2025 ReseñasCRUD. Todos los derechos reservados.</p>
    <p>Direccion:<br>
      <a href="https://www.google.com/maps/place/AIEP+Rancagua/@-34.1699218,-70.7357336,17z/data=!3m1!4b1!4m6!3m5!1s0x96634342188fb3a1:0xc54017472f5d991d!8m2!3d-34.1699218!4d-70.7357336!16s%2Fg%2F1thtqs_f?entry=ttu" target="_blank" style="color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: opacity 0.3s;">
        <img src="iconos/aiep2.jpg" alt="Ubicación en Google Maps" style="width: 24px; height: 24px; vertical-align: middle;">
        <span>C. Cuevas 70, 2840079 Rancagua, O'Higgins</span>
      </a>
    </p>
    <p>Contacto:<br><a href="mailto:javier.polancop@correoaiep.cl" style="color: #fff; text-decoration: none;">javier.polancop@correoaiep.cl</a><br><a href="mailto:luciano.gonzalezpe@correoaiep.cl" style="color: #fff; text-decoration: none;">luciano.gonzalezpe@correoaiep.cl</a></p>
  `;

  document.body.appendChild(footer);
}

/* ========= EXPORTS ========= */
window.iniciarSesion=iniciarSesion; window.registrarUsuario=registrarUsuario; window.cerrarSesion=cerrarSesion; window.cargarCategorias=cargarCategorias; window.irCategorias=irCategorias; window.cargarReseñasPorLugar=cargarReseñasPorLugar; window.agregarReseña=agregarReseña; window.listarGlobal=listarGlobal; window.editarReseñaGlobal=editarReseñaGlobal; window.eliminarReseñaGlobal=eliminarReseñaGlobal; window.buscarPorUsuario=buscarPorUsuario; window.filtrarRango=filtrarRango; window.filtrarPorFecha=filtrarPorFecha; window.iniciarNavegacionPorLugar=iniciarNavegacionPorLugar; window.mostrarLugaresReportes=mostrarLugaresReportes; window.mostrarReseñasReportes=mostrarReseñasReportes; window.listarUsuariosRegistrados=listarUsuariosRegistrados; window.listarLugaresAdmin=listarLugaresAdmin; window.editarLugar=editarLugar; window.eliminarLugar=eliminarLugar; window.eliminarUsuario=eliminarUsuario; window.crearLugar=crearLugar; window.cambiarLugar=cambiarLugar; window.irAReseñas=irAReseñas; window.prepararCarrusel=prepararCarrusel; window.mostrarGraficoReseñasPorLugar=mostrarGraficoReseñasPorLugar;

/* ========= DISPATCH ========= */
window.onload = () => {
  crearFooter(); // Llamamos a la función para crear el footer en cada carga de página
  const path = window.location.pathname.toLowerCase();
  if(path.endsWith("categorias.html")) cargarCategorias();
  if(path.endsWith("reseñas.html")) cargarReseñasPorLugar();
  if(path.endsWith("bdadmin.html")) {
    if(ensureAuthOrRedirect() !== "admin") { alert("Acceso denegado"); window.location.href="categorias.html"; return; }
    listarGlobal(); listarUsuariosRegistrados(); listarLugaresAdmin(); iniciarNavegacionPorLugar();
  }
  if(path.endsWith("index.html") || path.endsWith("/")) seedIfNeeded();
};