// src/documentoTabla.js
// Manejo de tablas dinámicas desde carpetas por categoría, descarga usando archivos .docx existentes y routing por hash.

const tablasFallback = {
  "Lab-1A": `
    <div class="container section">
      <button class="btn-regresar" data-back>⬅ Regresar a Inventario</button>
      <h2>Inventario - Lab 1A</h2>
      <p>Fallback de Lab-1A: no se encontró archivo.</p>
    </div>
  `,
  "descargar": `
    <div class="container section">
      <button class="btn-regresar" data-back>⬅ Regresar a Inventario</button>
      <h2>Descargar todos los inventarios</h2>
      <p>Haz click en <strong>--Descargar todos--</strong> para bajar el archivo Word con los datos actualmente visibles.</p>
    </div>
  `
};

let currentData = null;
let currentTitle = "";
let currentCategory = "";
let currentTable = "";
const HASH_PREFIX = "inventario.";

// Ir a inventario limpio
function goToInventario() {
  history.replaceState(null, "", "#inventario");
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

// Fetch DOCX y convertir a JSON (tabla) usando mammoth
async function fetchDocxToJson(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return false;
    const buffer = await resp.arrayBuffer();

    if (!globalThis.mammoth) {
      console.warn("mammoth no está disponible en window (asegura <script> en index.html)");
      return false;
    }

    // Convertir a HTML para leer tabla
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = htmlResult.value || "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const table = doc.querySelector("table");

    if (table) {
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) return [];
      // Cabeceras (preferimos th)
      const headerCells = Array.from(rows[0].querySelectorAll("th,td"))
        .map(c => (c.textContent || "").trim() || "__EMPTY");
      const data = rows.slice(1).map(row => {
        const cells = Array.from(row.querySelectorAll("td,th"));
        const obj = {};
        headerCells.forEach((h, i) => {
          obj[h] = (cells[i] && (cells[i].textContent || "").trim()) || "";
        });
        return obj;
      });
      if (data.length === 0) return [];
      return data;
    }

    // Si no hay tabla, extraer texto crudo
    const rawResult = await mammoth.extractRawText({ arrayBuffer: buffer });
    const raw = rawResult.value || "";
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
    if (lines.length === 0) return [];
    const first = lines[0];
    const sep = first.includes("\t") ? /\t+/ : /\s{2,}/;
    const headers = first.split(sep).map(h => (h || "__EMPTY").trim());
    const data = lines.slice(1).map(line => {
      const cols = line.split(sep);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (cols[i] || "").trim();
      });
      return obj;
    });
    return data;
  } catch (err) {
    console.warn("fetchDocxToJson error:", err);
    return false;
  }
}

// Limpiar JSON de filas vacías
function cleanJson(json) {
  if (!Array.isArray(json)) return [];
  return json.filter(row => {
    const values = Object.values(row).map(v => (v ?? "").toString().trim());
    // Filtrar filas completamente vacías
    if (values.every(v => v === "")) return false;
    // Filtrar filas cuyo primer campo 'N°' esté vacío (ejemplo)
    if ("N°" in row && String(row["N°"]).trim() === "") return false;
    return true;
  });
}

// Renderizar tabla desde JSON
function renderTablaFromJson(data, title = "Tabla") {
  currentData = Array.isArray(data) ? data : null;
  currentTitle = title;

  const content = document.getElementById("content");
  if (!content) return;

  const container = document.createElement("div");
  container.className = "container section";

  const backBtn = document.createElement("button");
  backBtn.className = "btn-regresar";
  backBtn.textContent = "⬅ Regresar a Inventario";
  backBtn.addEventListener("click", goToInventario);
  container.appendChild(backBtn);

  const h2 = document.createElement("h2");
  h2.textContent = `Inventario - ${title}`;
  container.appendChild(h2);

  if (!currentData || currentData.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No hay datos para mostrar.";
    container.appendChild(p);
    content.replaceChildren(container);
    return;
  }

  const table = document.createElement("table");
  table.className = "tabla-inventario";

  const caption = document.createElement("caption");
  caption.textContent = title;
  table.appendChild(caption);

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  // Filtrar columnas vacías '__EMPTY'
  const keys = Object.keys(currentData[0]).filter(k => !k.startsWith("__EMPTY"));
  keys.forEach(k => {
    const th = document.createElement("th");
    th.textContent = k;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  currentData.forEach(row => {
    const tr = document.createElement("tr");
    keys.forEach(k => {
      const td = document.createElement("td");
      const val = row[k] != null ? row[k] : "";
      td.textContent = String(val);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);

  // Botón descarga DOCX del archivo existente
  const wrap = document.createElement("div");
  wrap.style.marginTop = "12px";
  const dlLink = document.createElement("a");
  dlLink.href = `src/word/${currentCategory}/${currentTable}.docx`;
  dlLink.className = "btn";
  dlLink.textContent = "Descargar Word";
  dlLink.setAttribute("download", `${title.replace(/\s+/g,"_")}.docx`);
  wrap.appendChild(dlLink);

  container.appendChild(wrap);
  content.replaceChildren(container);
}

// Manejar click en tabla/categoría
async function handleTablaClick(tabla, categoria = "Monitores") {
  if (!tabla) return;
  const content = document.getElementById("content");
  if (!content) return;

  try {
    history.replaceState(null, "", `#${HASH_PREFIX}${encodeURIComponent(categoria)}/${encodeURIComponent(tabla)}`);
  } catch (err) {}

  currentCategory = categoria;
  currentTable = tabla;

  // Ruta al .docx en cada categoría
  const docPath = `src/word/${categoria}/${tabla}.docx`;
  let json = await fetchDocxToJson(docPath);
  if (json) {
    const cleaned = cleanJson(json);
    if (cleaned && cleaned.length > 0) {
      renderTablaFromJson(cleaned, `${categoria} - ${tabla}`);
      return;
    }
  }

  // Fallback visual si no hay .docx o error
  if (tablasFallback[tabla]) {
    const tpl = document.createElement("template");
    tpl.innerHTML = tablasFallback[tabla].trim();
    const node = tpl.content.firstElementChild;
    const backBtn = node.querySelector("[data-back]");
    if (backBtn) backBtn.addEventListener("click", goToInventario);
    content.replaceChildren(node);
    currentData = null;
    currentTitle = tabla;
    return;
  }

  // Si no hay nada
  const div = document.createElement("div");
  div.className = "container";
  div.innerHTML = `<button class="btn-regresar" onclick="goToInventario()">⬅ Regresar a Inventario</button><p>No hay datos para ${tabla}</p>`;
  content.replaceChildren(div);
  currentData = null;
  currentTitle = tabla;
}

// Delegación de eventos
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-tabla]");
  if (link) {
    e.preventDefault();
    const tabla = link.getAttribute("data-tabla");
    const categoria = link.getAttribute("data-categoria") || "Monitores";

    if (tabla === "descargar") {
      // Descargar archivo Word existente de la categoría
      const path = `src/word/${categoria}/Lab-1A.docx`;
      const a = document.createElement('a');
      a.href = path;
      a.download = `${categoria}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    handleTablaClick(tabla, categoria);
  }
});

// Inicialización (parseo de hash)
function parseHash() {
  const full = (window.location.hash || "").slice(1);
  if (!full) return null;
  if (full === "inventario") return { section: "inventario" };
  if (full.startsWith(HASH_PREFIX)) {
    const encoded = full.slice(HASH_PREFIX.length);
    const [categoria, tabla] = encoded.split("/");
    if (categoria && tabla) {
      return { section: "inventario", categoria: decodeURIComponent(categoria), tabla: decodeURIComponent(tabla) };
    }
  }
  return null;
}

window.addEventListener("DOMContentLoaded", () => {
  const parsed = parseHash();
  if (parsed && parsed.section === "inventario" && parsed.tabla) {
    handleTablaClick(parsed.tabla, parsed.categoria || "Monitores");
  }
});
