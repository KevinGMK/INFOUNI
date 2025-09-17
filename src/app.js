/* app.js - SPA + header COLLAPSE al scrollear (ahora: header grande por defecto;
   al bajar la página se agrega .collapsed y el header pasa a fila: título izquierda, nav derecha)
*/

const content = document.getElementById('content');
const header = document.querySelector('.site-header') || document.querySelector('header');
const root = document.documentElement;
const NAV_SELECTOR = '[data-section]';
const THRESHOLD = 60; // px para activar COLLAPSE (ajusta si quieres)
let ticking = false;
let currentSection = null;
let isAnimating = false;

/* -------------------------
   Plantillas de secciones (incluye la imagen #inicio2)
   ------------------------- */
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
        <div class="tarjeta">
            <div class="tarjeta-header">Monitores</div>
            <div class="tarjeta-content">
                <div class="fila">
                    <a href="#" data-tabla="Lab-1A">Lab-1A</a>
                    <a href="#" data-tabla="Lab-2A">Lab-2A</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1B">Lab-1B</a>
                    <a href="#" data-tabla="Lab-2B">Lab-2B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1C">Lab-1C</a>
                    <a href="#" data-tabla="Lab-2C">Lab-2C</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1D">Lab-1D</a>
                    <a href="#" data-tabla="Lab-3B">Lab-3B</a>
                </div>
                <div class="fila">
                    <a href="#" data-tabla="Lab-1E">Lab-1E</a>
                </div>
                <div class="fila descarga">
                    <a href="#" data-tabla="descargar">--Descargar todos--</a>
                </div>
            </div>
        </div>
        <div class="tarjeta">
            <div class="tarjeta-header">Monitores</div>
            <div class="tarjeta-content">
                <div class="fila">
                    <span>Lab-1A</span><span>Lab-2A</span>
                </div>
                <div class="fila">
                    <span>Lab-1B</span><span>Lab-2B</span>
                </div>
                <div class="fila">
                    <span>Lab-1C</span><span>Lab-2C</span>
                </div>
                <div class="fila">
                    <span>Lab-1D</span><span>Lab-3B</span>
                </div>
                <div class="fila">
                    <span>Lab-1E</span><span></span>
                </div>
                <div class="fila descarga">
                    <span>--Descargar todos--</span>
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
   Helpers: altura del header + estado visual
   ------------------------- */
function updateHeaderHeight(){
  if(!header) return;
  const h = header.offsetHeight;
  root.style.setProperty('--header-height', `${h}px`);
}

/* Lógica invertida: header GRANDE por defecto; al bajar -> add .collapsed */
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

/* Scroll listener optimizado */
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
  applyHeaderStateOnScroll(); // estado inicial
});

/* -------------------------
   Render simple de secciones con pequeña animación
   ------------------------- */
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
   SPA loading + history
   ------------------------- */
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
   ------------------------- */
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

  updateHeaderHeight();
}

/* -------------------------
   Inicialización
   ------------------------- */
(function init(){
  const initial = location.hash.replace('#','') || 'inicio';
  loadSection(initial, {push:false});

  document.querySelectorAll(NAV_SELECTOR).forEach(a=>{
    a.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); a.click(); }
    });
  });

  const yearSpan = document.getElementById('year');
  if(yearSpan) yearSpan.textContent = new Date().getFullYear();
})();

function loadSectionFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (sections[hash]) {
    content.innerHTML = sections[hash];
    currentSection = hash;
  }
}

// Ejecutar al cargar la página
window.addEventListener("DOMContentLoaded", loadSectionFromHash);

// Ejecutar si el hash cambia (ej: con boton Regresar)
window.addEventListener("hashchange", loadSectionFromHash);
