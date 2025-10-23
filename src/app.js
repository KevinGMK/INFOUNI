/* app.js - SPA + header COLLAPSE al scrollear
   Reescrito para listar dinámicamente:
   src/excel/Monitores/<Lab>.xlsx
   src/excel/Teclados/<Lab>.xlsx
   src/excel/Escritorios/<Lab>.xlsx
   src/excel/Pcs/<Lab>.xlsx
   Al clickear un archivo -> dispatchEvent('open-excel', { path, category, name })
*/

const content = document.getElementById('content');
const header = document.querySelector('.site-header') || document.querySelector('header');
const root = document.documentElement;
const NAV_SELECTOR = '[data-section]';
const THRESHOLD = 60; // px para activar COLLAPSE
let ticking = false;
let currentSection = null;
let isAnimating = false;

/* -------------------------
   CONFIG - categorías y labs (ajusta si cambias nombres)
*/
const CATEGORIES = ['Monitores','Teclados','Escritorios','Pcs'];
const LABS = ['Lab-1A','Lab-1B','Lab-1C','Lab-1D','Lab-1E','Lab-2A','Lab-2B','Lab-2C','Lab-3B'];

/* -------------------------
   Plantillas de secciones (incluye la imagen #inicio2)
   El inventario contiene un root (#inventario-root) donde inyectamos tarjetas
*/
const sections = {
  inicio: `
    <div class="container section" aria-labelledby="title-inicio">
      <img src="img/inicio.jpg" id="inicio2" alt="Soporte INFOUNI">
      <h2 id="title-inicio" class="section-title">INFOUNI</h2>
      <p>Un lugar seguro para guardar y modificar archivos en tiempo real</p>
    </div>
  `,
  inventario: `
    <div class="container section" aria-labelledby="title-inventario">
        <h2 id="title-inventario" class="section-title">Inventario</h2>
        <div class="search-container">
          <input type="text" id="buscador" placeholder="Buscar modelo o patrimonio...">
          <div id="resultados-busqueda" class="resultados-flotantes"></div>
        </div>

        <div class="tarjeta">
            <div class="tarjeta-header">Monitores</div>
            <div class="tarjeta-content">
                <div class="fila">
                    <a href="#" data-tabla="Lab-1A" data-categoria="Monitores">Lab-1A</a>
                    <a href="#" data-tabla="Lab-2A" data-categoria="Monitores">Lab-2A</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1B" data-categoria="Monitores">Lab-1B</a>
                    <a href="#" data-tabla="Lab-2B" data-categoria="Monitores">Lab-2B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1C" data-categoria="Monitores">Lab-1C</a>
                    <a href="#" data-tabla="Lab-2C" data-categoria="Monitores">Lab-2C</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1D" data-categoria="Monitores">Lab-1D</a>
                    <a href="#" data-tabla="Lab-3B" data-categoria="Monitores">Lab-3B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1E" data-categoria="Monitores">Lab-1E</a>
                </div>
                <div class="fila descarga">
                    <a href="#" data-tabla="descargar">--Descargar todos--</a>
                </div>
            </div>
        </div>
        
        <div class="tarjeta">
            <div class="tarjeta-header">Teclados</div>
            <div class="tarjeta-content">
                <div class="fila">
                    <a href="#" data-tabla="Lab-1A" data-categoria="Teclados">Lab-1A</a>
                    <a href="#" data-tabla="Lab-2A" data-categoria="Teclados">Lab-2A</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1B" data-categoria="Teclados">Lab-1B</a>
                    <a href="#" data-tabla="Lab-2B" data-categoria="Teclados">Lab-2B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1C" data-categoria="Teclados">Lab-1C</a>
                    <a href="#" data-tabla="Lab-2C" data-categoria="Teclados">Lab-2C</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1D" data-categoria="Teclados">Lab-1D</a>
                    <a href="#" data-tabla="Lab-3B" data-categoria="Teclados">Lab-3B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1E" data-categoria="Teclados">Lab-1E</a>
                </div>
                <div class="fila descarga">
                    <a href="#" data-tabla="descargar">--Descargar todos--</a>
                </div>
            </div>
        </div>
        <div class="tarjeta">
            <div class="tarjeta-header">Escritorios</div>
            <div class="tarjeta-content">
                <div class="fila">
                    <a href="#" data-tabla="Lab-1A" data-categoria="Escritorios">Lab-1A</a>
                    <a href="#" data-tabla="Lab-2A" data-categoria="Escritorios">Lab-2A</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1B" data-categoria="Escritorios">Lab-1B</a>
                    <a href="#" data-tabla="Lab-2B" data-categoria="Escritorios">Lab-2B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1C" data-categoria="Escritorios">Lab-1C</a>
                    <a href="#" data-tabla="Lab-2C" data-categoria="Escritorios">Lab-2C</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1D" data-categoria="Escritorios">Lab-1D</a>
                    <a href="#" data-tabla="Lab-3B" data-categoria="Escritorios">Lab-3B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1E" data-categoria="Escritorios">Lab-1E</a>
                </div>
                <div class="fila descarga">
                    <a href="#" data-tabla="descargar">--Descargar todos--</a>
                </div>
            </div>
        </div>
        <div class="tarjeta">
            <div class="tarjeta-header">Pcs</div>
            <div class="tarjeta-content">
                <div class="fila">
                    <a href="#" data-tabla="Lab-1A" data-categoria="Pcs">Lab-1A</a>
                    <a href="#" data-tabla="Lab-2A" data-categoria="Pcs">Lab-2A</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1B" data-categoria="Pcs">Lab-1B</a>
                    <a href="#" data-tabla="Lab-2B" data-categoria="Pcs">Lab-2B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1C" data-categoria="Pcs">Lab-1C</a>
                    <a href="#" data-tabla="Lab-2C" data-categoria="Pcs">Lab-2C</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1D" data-categoria="Pcs">Lab-1D</a>
                    <a href="#" data-tabla="Lab-3B" data-categoria="Pcs">Lab-3B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1E" data-categoria="Pcs">Lab-1E</a>
                </div>
                <div class="fila descarga">
                    <a href="#" data-tabla="descargar">--Descargar todos--</a>
                </div>
            </div>
        </div>
    </div>`,
  contacto: `
    <div class="container section" aria-labelledby="title-contacto">
      <h2 id="title-contacto" class="section-title">Contacto</h2>
      <form id="contact-form" aria-label="Formulario de contacto">
        <input type="text" name="nombre" placeholder="Nombre" required />
        <input type="email" name="email" placeholder="Correo institucional" required />
        <textarea name="mensaje" placeholder="Describe el problema" required></textarea>
        <button class="btn" type="submit">Enviar</button>
      </form>
    </div>
  `
};

/* -------------------------
   Helpers header / layout
*/
function updateHeaderHeight(){
  if(!header) return;
  const h = header.offsetHeight;
  root.style.setProperty('--header-height', `${h}px`);
}

function applyHeaderStateOnScroll(){
  if(!header) return;
  const y = window.scrollY || window.pageYOffset;
  if(y > THRESHOLD){
    if(!header.classList.contains('collapsed')) header.classList.add('collapsed');
  } else {
    if(header.classList.contains('collapsed')) header.classList.remove('collapsed');
  }
  updateHeaderHeight();
}

window.addEventListener('scroll', ()=>{
  if(!ticking){
    window.requestAnimationFrame(()=>{
      applyHeaderStateOnScroll();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

window.addEventListener('resize', updateHeaderHeight);
window.addEventListener('load', ()=>{
  updateHeaderHeight();
  applyHeaderStateOnScroll();
});

/* -------------------------
   Render simple de secciones con anim (mantiene tu lógica)
*/
function renderSectionHTML(html){
  if(isAnimating) return;
  isAnimating = true;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  const newNode = wrapper.firstElementChild;

  if(!newNode){
    isAnimating = false;
    content.innerHTML = '<div class="container"><h2>Sección no encontrada</h2></div>';
    return;
  }

  const old = content.firstElementChild;
  if(old){
    old.style.transition = 'opacity 220ms ease, transform 260ms ease';
    old.style.opacity = 0;
    old.style.transform = 'translateX(-10px)';
    setTimeout(()=>{
      if(content.contains(old)) content.removeChild(old);
      content.appendChild(newNode);
      newNode.style.opacity = 0;
      newNode.style.transform = 'translateX(10px)';
      void newNode.offsetWidth;
      newNode.style.transition = 'opacity 320ms cubic-bezier(.2,.9,.2,1), transform 320ms cubic-bezier(.2,.9,.2,1)';
      newNode.style.opacity = 1;
      newNode.style.transform = 'translateX(0)';
      setTimeout(()=>{
        newNode.style.transition = '';
        newNode.style.transform = '';
        newNode.style.opacity = '';
        isAnimating = false;
        postRenderBindings();
      }, 360);
    }, 220);
  } else {
    content.appendChild(newNode);
    newNode.style.opacity = 0;
    newNode.style.transform = 'translateX(8px)';
    requestAnimationFrame(()=>{
      newNode.style.transition = 'opacity 320ms ease, transform 320ms ease';
      newNode.style.opacity = 1;
      newNode.style.transform = 'translateX(0)';
      setTimeout(()=>{
        newNode.style.transition = '';
        newNode.style.transform = '';
        isAnimating = false;
        postRenderBindings();
      }, 360);
    });
  }

  updateHeaderHeight();
}

/* -------------------------
   SPA loading + history (mantengo tu API)
*/
function loadSection(name, {push=true} = {}){
  if(!sections[name]) name = 'inicio';
  if(name === currentSection) return;
  currentSection = name;
  renderSectionHTML(sections[name]);
  document.querySelectorAll(NAV_SELECTOR).forEach(a=>{
    const t = a.getAttribute('data-section');
    if(t === name) a.classList.add('active');
    else a.classList.remove('active');
  });
  if(push) history.pushState({section:name}, '', `#${name}`);
}

/* Delegación para enlaces con data-section */
document.addEventListener('click', (e)=>{
  const a = e.target.closest(NAV_SELECTOR);
  if(!a) return;
  e.preventDefault();
  const section = a.getAttribute('data-section');
  if(section) loadSection(section);
}, { passive:false });

/* back/forward */
window.addEventListener('popstate', (e)=>{
  const stateSection = (e.state && e.state.section) || location.hash.replace('#','') || 'inicio';
  loadSection(stateSection, {push:false});
});

/* -------------------------
   Post-render bindings (formularios y botones)
*/
function postRenderBindings(){
  const form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const name = form.nombre?.value || 'Usuario';
      alert(`Gracias ${name}. Mensaje registrado (demo).`);
      form.reset();
    });
  }

  const solBtn = document.getElementById('solicitar-soporte');
  if(solBtn){
    solBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      loadSection('contacto');
      setTimeout(()=>{
        const firstField = document.querySelector('#contact-form input');
        if(firstField) firstField.focus();
      }, 420);
    });
  }

  // Si cargamos la sección INVENTARIO, inicializamos el listado dinámico
  if(currentSection === 'inventario') {
    initInventory(); // construido abajo

    if (typeof inicializarBuscador === "function") {
      inicializarBuscador();
    }
  }

  updateHeaderHeight();
}

/* -------------------------
   UTIL: helpers para hash
*/
function encodeHash(s){ return encodeURIComponent(s).replace(/%20/g,' '); }
function decodeHash(s){ try { return decodeURIComponent(s); } catch { return s; } }

/* -------------------------
   INVENTORY builder
   - Genera por cada categoría una tarjeta con la lista de LABS (links)
   - Cada enlace -> data-file = src/excel/<Category>/<Lab>.xlsx
   - También crea un enlace "--Descargar todos--" por categoría (data-file = carpeta)
*/
let pendingOpen = null; // si hash pide abrir algo antes de que initInventory termine

function createCardForCategory(cat){
  const card = document.createElement('div');
  card.className = 'tarjeta';
  const headerHTML = `<div class="tarjeta-header">${cat}</div>`;
  const contentHTML = `<div class="tarjeta-content"><div class="fila-grid"></div></div>`;
  card.innerHTML = headerHTML + contentHTML;
  return card;
}

function initInventory(){
  const root = document.getElementById('inventario-root');
  if(!root) return;
  // Limpiar y poblar
  root.replaceChildren();

  CATEGORIES.forEach(cat => {
    const card = createCardForCategory(cat);
    const grid = card.querySelector('.fila-grid');

    // añadimos los LABS...
    LABS.forEach(lab => {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'archivo-link';
      a.dataset.file = `src/excel/${encodeURIComponent(cat)}/${encodeURIComponent(lab)}.xlsx`;
      a.dataset.name = lab;
      a.dataset.category = cat;
      a.textContent = lab;
      grid.appendChild(a);
    });

    // añadir el link de descargar todos por categoría
    const dlWrap = document.createElement('div');
    dlWrap.className = 'fila descarga';
    // Se agrega data-category al enlace de "Descargar todos"
    dlWrap.innerHTML = `<a href="#" class="archivo-link descargar-categoria" data-category="${cat}" data-file="src/excel/${encodeURIComponent(cat)}" data-name="${cat}">--Descargar todos--</a>`;
    card.querySelector('.tarjeta-content').appendChild(dlWrap);

    root.appendChild(card);
  });

  // si alguien pidió abrir algo por el hash antes de que terminemos, lo ejecutamos:
  if(pendingOpen){
    // dispatch open-excel
    const {category, name} = pendingOpen;
    // buscar el link y simular click / dispatch event
    const selector = `.archivo-link[data-name="${CSS.escape(name)}"][data-category="${CSS.escape(category)}"]`;
    const link = document.querySelector(selector);
    // si no existe (p. ej. descargar-categoria) buscamos por data-file
    if(link){
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } else {
      // fallback: dispatch event manual con path
      const path = `src/excel/${encodeURIComponent(category)}/${encodeURIComponent(name)}.xlsx`;
      document.dispatchEvent(new CustomEvent('open-excel', { detail: { path, category, name } }));
    }
    pendingOpen = null;
  }
}

/* -------------------------
   Click global en archivos -> dispatch open-excel
   - Actualiza URL con replaceState (no navega)
*/
document.addEventListener('click', (e)=>{
  const a = e.target.closest('.archivo-link');
  if(!a) return;
  e.preventDefault();

  const path = a.dataset.file;
  const category = a.dataset.category || null;
  const name = a.dataset.name || null;
  const isDescargarCategoria = a.classList.contains('descargar-categoria');

  // Actualizar URL (persistente) sin crear nueva entrada en historial
  try {
    if(category && name && !isDescargarCategoria){
      history.replaceState(null, '', `#inventario.${encodeURIComponent(category)}.${encodeURIComponent(name)}`);
    } else if (category && isDescargarCategoria){
      history.replaceState(null, '', `#inventario.${encodeURIComponent(category)}.descargar`);
    } else {
      history.replaceState(null, '', '#inventario');
    }
  } catch{}

  // Emitir evento que documentoTabla.js escuchará
  document.dispatchEvent(new CustomEvent('open-excel', { detail: { path, category, name } }));
});

/* -------------------------
   Parse hash patterns:
   #inventario                 -> sección inventario
   #inventario.<Category>.<Lab> -> abrir archivo
   #inventario.<Category>.descargar -> descargar categoría
*/
function parseInventoryHash(){
  const full = (window.location.hash || '').slice(1); // quitar #
  if(!full) return null;
  if(!full.startsWith('inventario')) return null;
  const parts = full.split('.'); // ["inventario", "Category", "Lab-1A"]
  if(parts.length === 1) return { section: 'inventario' };
  if(parts.length >= 3){
    const category = decodeHash(parts[1]);
    const name = decodeHash(parts.slice(2).join('.')); // por si el lab tiene puntos (no pasa ahora)
    return { section: 'inventario', category, name };
  }
  return { section: 'inventario' };
}

/* -------------------------
   Hash handling on load & change
   - Si el hash pide abrir archivo y aún no se ha inicializado inventario:
     guardamos en pendingOpen para ejecutarlo al terminar initInventory()
*/
window.addEventListener('DOMContentLoaded', ()=>{
  const parsed = parseInventoryHash();
  if(parsed && parsed.section === 'inventario'){
    loadSection('inventario', { push:false });
    if(parsed.category && parsed.name){
      // puede ocurrir antes de que initInventory haya terminado
      pendingOpen = { category: parsed.category, name: parsed.name };
    }
  } else {
    // cargar lo normal (inicio u otra sección)
    const initial = location.hash.replace('#','') || 'inicio';
    loadSection(initial, { push:false });
  }
});

window.addEventListener('hashchange', ()=>{
  const parsed = parseInventoryHash();
  if(!parsed) {
    // si es otro hash, dejar que loadSectionFromHash lo maneje
    loadSectionFromHash();
    return;
  }

  // si el user modificó hash a inventario.something -> asegurarse de estar en inventario y abrir
  if(parsed.section === 'inventario'){
    // si no estamos cargando inventario aún, load it
    if(currentSection !== 'inventario'){
      loadSection('inventario', { push:false });
    }
    if(parsed.category && parsed.name){
      // si el inventario ya está inicializado, forzamos el open
      // guardarlo en pendingOpen y llamar initInventory para que ejerza
      pendingOpen = { category: parsed.category, name: parsed.name };
      // si inventario ya mostró tarjetas, ejecutamos inmediatamente:
      const selector = `.archivo-link[data-name="${CSS.escape(parsed.name)}"][data-category="${CSS.escape(parsed.category)}"]`;
      const link = document.querySelector(selector);
      if(link){
        link.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
        pendingOpen = null;
      } else {
        // if not found, initInventory will handle pendingOpen
        initInventory();
      }
    } else {
      // solo #inventario -> mostramos inventario (initInventory hace replaceChildren)
      initInventory();
    }
  }
});

/* -------------------------
   Utility: load section from hash (simple)
*/
function loadSectionFromHash(push = false) {
  const hash = window.location.hash.replace('#', '');
  if (sections[hash]) {
    content.innerHTML = sections[hash];
    currentSection = hash;
  }
}

// Ejecutar al cargar la página
window.addEventListener("DOMContentLoaded", () => loadSectionFromHash(false));

// Ejecutar si el hash cambia (ej: con boton Regresar)
window.addEventListener("hashchange", () => loadSectionFromHash(false));


/* -------------------------
   Exports (opcional) para debug
*/
window.initInventory = initInventory;
window.CATEGORIES = CATEGORIES;
window.LABS = LABS;

/* -----------------------
   Descargar varias tablas (toda una categoría) en un único DOCX (cada lab en su propia sección)
   - Primero: intenta descargar src/word/<Category>/<Category>.docx (rápido).
   - Si no existe: intenta leer src/word/<Category>/Lab-*.docx con fetchDocxToJson y generar un .doc (HTML) combinado.
   - Evita depender de la librería 'docx' en CDN (que te daba 404).
   ----------------------- */
async function downloadMultipleJsonAsDocx(category, filename) {
  const labs = (window.LABS && Array.isArray(window.LABS) && window.LABS.length)
    ? window.LABS.slice()
    : ['Lab-1A','Lab-1B','Lab-1C','Lab-1D','Lab-1E','Lab-2A','Lab-2B','Lab-2C','Lab-3B'];

  filename = filename || `${category || 'inventario'}_completo.docx`;

  // 1) Intentar descargar el .docx de categoría ya preparado
  const categoryFilePath = `src/word/${encodeURIComponent(category)}/${encodeURIComponent(category)}.docx`;
  try {
    // Intentamos GET (muchos servidores no responden bien a HEAD con archivos estáticos)
    const resp = await fetch(categoryFilePath, { method: 'GET' });
    if (resp && resp.ok) {
      const a = document.createElement('a');
      a.href = categoryFilePath;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
  } catch (err) {
    // continuar con fallback (no detener)
    console.warn("No se pudo descargar el docx de categoría directamente:", categoryFilePath, err);
  }

  // 2) Fallback: intentar leer Lab-*.docx y combinar (solo si existe fetchDocxToJson)
  if (typeof fetchDocxToJson !== 'function') {
    alert(`No se encontró ${category}.docx y no está disponible la función para construir el archivo desde Lab-*.docx.`);
    return;
  }

  try {
    const datasets = [];
    for (const lab of labs) {
      const path = `src/word/${encodeURIComponent(category)}/${encodeURIComponent(lab)}.docx`;
      try {
        const json = await fetchDocxToJson(path).catch(()=>false);
        if (json && Array.isArray(json) && json.length) {
          const cleaned = (typeof cleanJson === 'function') ? cleanJson(json) : json.filter(r => Object.values(r).some(v => (v ?? '').toString().trim() !== ''));
          if (cleaned && cleaned.length) datasets.push({ lab, json: cleaned });
        }
      } catch (err) {
        console.warn("Error leyendo", path, err);
      }
    }

    if (!datasets.length) {
      alert(`No se encontraron tablas en los Lab-*.docx para la categoría "${category}".`);
      return;
    }

    function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

    let html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial, sans-serif;} table{border-collapse:collapse;width:100%;} 
      th{background:#396497;color:#fff;padding:8px;border:1px solid #ccc;text-align:center;}
      td{padding:6px;border:1px solid #ddd;text-align:center;} tr:nth-child(even) td{background:#eaf4ff;}
      .page-break{page-break-after:always;}
    </style></head><body>`;

    datasets.forEach((ds, i) => {
      const keys = Object.keys(ds.json[0] || {});
      html += `<h2 style="text-align:center;">${escapeHtml(category)} - ${escapeHtml(ds.lab)}</h2>`;
      html += `<table><thead><tr>`;
      keys.forEach(k => html += `<th>${escapeHtml(k)}</th>`);
      html += `</tr></thead><tbody>`;
      ds.json.forEach(row => {
        html += `<tr>`;
        keys.forEach(k => html += `<td>${escapeHtml(row[k] != null ? String(row[k]) : "")}</td>`);
        html += `</tr>`;
      });
      html += `</tbody></table>`;
      if (i < datasets.length - 1) html += `<div class="page-break"></div>`;
    });

    html += `</body></html>`;

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.docx?$/,'') + '.doc';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;

  } catch (err) {
    console.error("Error generando fallback combinado:", err);
    alert("No se pudo generar el archivo con todas las tablas.");
  }
}


// Exponer globalmente (para que app.js o botones puedan invocar)
window.downloadMultipleJsonAsDocx = downloadMultipleJsonAsDocx;

/* -----------------------
   Integración con evento 'open-excel' (disparado por app.js)
   Si app.js envía category con path a carpeta -> descargamos todos
   ----------------------- */
document.addEventListener('open-excel', (ev) => {
  try {
    const detail = ev.detail || {};
    const { path = '', category = null, name = null } = detail;

    // Si path no termina en .xlsx (es una carpeta) o si app.js marcó descargar-categoria
    const isFolder = path && !path.toLowerCase().endsWith('.xlsx');
    // Si name equals category and path is folder: it's the "descargar todos" from app.js
    if (category && (isFolder || name === category)) {
      // llamamos a la función de descarga multiple
      downloadMultipleJsonAsDocx(category, `${category}_inventario.docx`);
      return;
    }

    // Si es un archivo individual, deferir al handler normal (por compatibilidad)
    if (category && name) {
      // name es el lab: abrirlo normalmente (si existe handleTablaClick)
      if (typeof handleTablaClick === 'function') {
        handleTablaClick(name, category);
      }
    }
  } catch (e) {
    console.warn("open-excel handler error:", e);
  }
});

// C:\Users\INFOUNI\Downloads\INFOUNI-gh-pages\INFOUNI\src\word\Monitores\Lab-1A hasta el Lab-3B