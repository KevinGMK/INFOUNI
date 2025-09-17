// src/documentoTabla.js
// Manejo de tablas dinámicas, fallback HTML, descarga y routing por hash.
// Requiere SheetJS (XLSX) incluido en index.html

const tablasFallback = {
  "Lab-1A": `
    <div class="container section">
      <h2>Inventario - Lab 1A</h2>
      <table class="tabla-inventario">
        <caption>Lista de Monitores (fallback)</caption>
        <thead>
          <tr><th>Equipo</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr><td>Monitor 1</td><td>Operativo</td></tr>
          <tr><td>Monitor 2</td><td>En revisión</td></tr>
          <tr><td>Monitor 3</td><td>Operativo</td></tr>
          <tr><td>Monitor 4</td><td>Fuera de servicio</td></tr>
        </tbody>
      </table>
    </div>
  `,
  "Lab-2A": `
    <div class="container section">
      <h2>Inventario - Lab 2A</h2>
      <p>Aquí se mostraría la tabla de inventario de Lab-2A (fallback).</p>
    </div>
  `,
  "descargar": `
    <div class="container section">
      <h2>Descargar todos los inventarios</h2>
      <p>Haz click en <strong>--Descargar todos--</strong> para bajar el Excel con los datos actualmente visibles.</p>
    </div>
  `
};

// Estado actual
let currentData = null;
let currentTitle = "";
const HASH_PREFIX = "inventario.";
let _skipNextHashHandler = false;

/* -----------------------
   UTIL: añadir botón regresar dentro del contenedor dado
   ----------------------- */
function addBackButton(container) {
  if (!container) return;

  // eliminar botón viejo si existe
  const old = container.querySelector(".btn-regresar");
  if (old) old.remove();

  // crear botón
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-regresar";
  btn.textContent = "⬅ Regresar";

  // insertarlo justo después del H2
  const h2 = container.querySelector("h2");
  if (h2 && h2.parentNode === container) {
    container.insertBefore(btn, h2.nextSibling);
  } else {
    container.insertBefore(btn, container.firstChild);
  }

  // comportamiento: volver a inventario
  btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    window.location.hash = "inventario"; // 🔑 solo esto
  });
}



/* -----------------------
   UTIL: fetch Excel -> JSON usando SheetJS
   devuelve array de objetos o false
   ----------------------- */
async function fetchExcelToJson(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return false;
    const buffer = await resp.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return json;
  } catch (err) {
    console.warn("fetchExcelToJson error:", err);
    return false;
  }
}

/* -----------------------
   Renderiza tabla desde JSON y agrega botón regresar
   ----------------------- */
function renderTablaFromJson(data, title = "Tabla") {
  currentData = Array.isArray(data) ? data : null;
  currentTitle = title;

  const content = document.getElementById("content");
  if (!content) return;

  const container = document.createElement("div");
  container.className = "container section";

  const h2 = document.createElement("h2");
  h2.textContent = `Inventario - ${title}`;
  container.appendChild(h2);

  if (!currentData || currentData.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No hay datos para mostrar.";
    container.appendChild(p);
    content.innerHTML = "";
    content.appendChild(container);
    addBackButton(container);
    return;
  }

  // crear tabla
  const table = document.createElement("table");
  table.className = "tabla-inventario";

  const caption = document.createElement("caption");
  caption.textContent = title;
  table.appendChild(caption);

  // thead
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const keys = Object.keys(currentData[0]);
  keys.forEach(k => {
    const th = document.createElement("th");
    th.textContent = k;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // tbody
  const tbody = document.createElement("tbody");
  currentData.forEach(row => {
    const tr = document.createElement("tr");
    keys.forEach(k => {
      const td = document.createElement("td");
      const val = row[k];
      td.textContent = (val === null || val === undefined) ? "" : String(val);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);

  // botón de descarga rápido
  const wrap = document.createElement("div");
  wrap.style.marginTop = "12px";
  const dlBtn = document.createElement("a");
  dlBtn.href = "#";
  dlBtn.className = "btn";
  dlBtn.textContent = "Descargar vista (XLSX)";
  dlBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentData) downloadJsonAsXlsx(currentData, `${title.replace(/\s+/g,"_")}.xlsx`);
  });
  wrap.appendChild(dlBtn);
  container.appendChild(wrap);

  // reemplazar contenido y añadir botón regresar
  content.innerHTML = "";
  content.appendChild(container);
  addBackButton(container);
}

/* -----------------------
   Exportar JSON visible a XLSX (navegador)
   ----------------------- */
function downloadJsonAsXlsx(json, filename = "export.xlsx") {
  try {
    const ws = XLSX.utils.json_to_sheet(json);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error exportando XLSX:", err);
    alert("No se pudo generar el archivo XLSX.");
  }
}

/* -----------------------
   Lógica para abrir tabla:
   1) intenta src/excel/<tabla>.xlsx
   2) intenta src/excel/Monitores.xlsx filtrando por etiqueta
   3) fallback HTML (tablasFallback)
   ----------------------- */
async function handleTablaClick(tabla) {
  if (!tabla) return;
  const content = document.getElementById("content");

  // Cambiar hash para que la vista sea persistente
  try {
    _skipNextHashHandler = true;
    window.location.hash = HASH_PREFIX + encodeURIComponent(tabla);
    setTimeout(() => { _skipNextHashHandler = false; }, 250);
  } catch (err) {}

  // 1) archivo individual
  const candidatePath = `src/excel/${tabla}.xlsx`;
  let json = await fetchExcelToJson(candidatePath);
  if (json) {
    renderTablaFromJson(json, tabla);
    return;
  }

  // 2) Monitores.xlsx y filtro por etiqueta
  const monitoresPath = `src/excel/Monitores.xlsx`;
  const monData = await fetchExcelToJson(monitoresPath);
  if (monData && Array.isArray(monData) && monData.length > 0) {
    const filtered = monData.filter(row => {
      return Object.values(row).some(v => {
        if (v === null || v === undefined) return false;
        return String(v).toLowerCase().includes(tabla.toLowerCase());
      });
    });
    if (filtered.length > 0) {
      renderTablaFromJson(filtered, `${tabla} (desde Monitores.xlsx)`);
      return;
    }
  }

  // 3) fallback HTML
  if (tablasFallback[tabla]) {
    content.innerHTML = tablasFallback[tabla];
    const container = content.querySelector(".container.section") || content.querySelector(".container");
    if (container) addBackButton(container);
    currentData = null;
    currentTitle = tabla;
    return;
  }

  content.innerHTML = `<div class="container"><p>No hay datos para ${tabla}</p></div>`;
  currentData = null;
  currentTitle = tabla;
}

/* -----------------------
   Delegación de eventos: captura links data-tabla y "descargar"
   ----------------------- */
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-tabla]");
  if (link) {
    e.preventDefault();
    const tabla = link.getAttribute("data-tabla");
    if (!tabla) return;
    if (tabla === "descargar") {
      if (currentData && currentData.length) {
        downloadJsonAsXlsx(currentData, `${currentTitle.replace(/\s+/g,"_") || "inventario"}.xlsx`);
      } else {
        fetchExcelToJson("src/excel/Monitores.xlsx").then(json => {
          if (json && json.length) downloadJsonAsXlsx(json, "Monitores.xlsx");
          else alert("No hay datos para descargar.");
        });
      }
      return;
    }
    handleTablaClick(tabla);
    return;
  }

  // captura global para btn-regresar (versión segura y minimal)
  if (e.target.matches(".btn-regresar")) {
    e.preventDefault();
    e.stopPropagation(); // evitar que otros listeners en el document actúen
    // solo actualizamos el hash; app.js será el responsable de renderizar #inventario
    try {
      _skipNextHashHandler = true; // bandera para evitar reentrada en nuestro propio handler
      window.location.hash = "inventario";
      // no hacemos dispatch ni innerHTML aquí — eso causa duplicados
    } catch (err) {
      // noop
    }
  }
});

/* -----------------------
   Inicialización según hash
   ----------------------- */
function parseHash() {
  const full = (window.location.hash || "").slice(1); // quitar #
  if (!full) return null;
  if (full === "inventario") return { section: "inventario" };
  if (full.startsWith(HASH_PREFIX)) {
    const encoded = full.slice(HASH_PREFIX.length);
    try {
      const tabla = decodeURIComponent(encoded);
      return { section: "inventario", tabla };
    } catch (err) {
      return { section: "inventario" };
    }
  }
  return null;
}

window.addEventListener("DOMContentLoaded", () => {
  const parsed = parseHash();
  if (parsed && parsed.section === "inventario" && parsed.tabla) {
    // abrir la tabla indicada por hash
    handleTablaClick(parsed.tabla);
  }
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.substring(1); // "inventario" o "inventario.Lab-1A"
  const [section, subsection] = hash.split(".");

  const contentEl = document.getElementById("content");
  if (!contentEl) return;

  // 🧹 limpiar antes de cargar
  contentEl.innerHTML = "";

  switch (section) {
    case "inventario":
      contentEl.innerHTML = sections.inventario;
      if (typeof initInventory === "function") {
        initInventory(subsection);
      }
      break;

    case "inicio":
      contentEl.innerHTML = sections.inicio;
      break;

    case "contacto":
      contentEl.innerHTML = sections.contacto;
      break;

    default:
      contentEl.innerHTML = sections.inicio;
      break;
  }
});

