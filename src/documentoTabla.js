// src/documentoTabla.js
// Manejo de tablas dinámicas (fallback), descarga y routing por hash (mínimo).

const tablasFallback = {
  "Lab-1A": `
    <div class="container section">
      <button class="btn-regresar" data-back>⬅ Regresar a Inventario</button>
      <h2>Inventario - Lab 1A</h2>
      <table class="tabla-inventario">
        <caption>Lista de Monitores</caption>
        <thead>
          <tr><th>Equipo</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr><td>Monitor 1</td><td>Operativo</td></tr>
          <tr><td>Monitor 2</td><td>En revisión</td></tr>
          <tr><td>Monitor 3</td><td>Fuera de servicio</td></tr>
        </tbody>
      </table>
    </div>
  `,
  "Lab-2A": `
    <div class="container section">
      <button class="btn-regresar" data-back>⬅ Regresar a Inventario</button>
      <h2>Inventario - Lab 2A</h2>
      <p>Aquí se mostraría la tabla de inventario de Lab-2A (fallback).</p>
    </div>
  `,
  "descargar": `
    <div class="container section">
      <button class="btn-regresar" data-back>⬅ Regresar a Inventario</button>
      <h2>Descargar todos los inventarios</h2>
      <p>Haz click en <strong>--Descargar todos--</strong> para bajar el Excel con los datos actualmente visibles.</p>
    </div>
  `
};

// Estado
let currentData = null;
let currentTitle = "";
const HASH_PREFIX = "inventario.";

/* -----------------------
   UTIL: ir a inventario limpio
   ----------------------- */
function goToInventario() {
  history.replaceState(null, "", "#inventario");
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/* -----------------------
   UTIL: fetch Excel -> JSON usando SheetJS
   ----------------------- */
async function fetchExcelToJson(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return false;
    const buffer = await resp.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convierte Excel a JSON (con valores vacíos si no hay nada)
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // 🚀 Limpia las columnas basura (__EMPTY, __EMPTY_1, etc.)
    const cleanedJson = json.map(row => {
      const obj = {};
      for (const key in row) {
        if (!key.startsWith("__EMPTY")) {
          obj[key] = row[key];
        }
      }
      return obj;
    });

    return cleanedJson; // 👈 ya devuelves la versión limpia
  } catch (err) {
    console.warn("fetchExcelToJson error:", err);
    return false;
  }
}


function cleanExcelJson(json) {
  if (!Array.isArray(json)) return [];

  return json.filter(row => {
    const values = Object.values(row).map(v => (v ?? "").toString().trim());
    const allEmpty = values.every(v => v === "");
    if (allEmpty) return false;

    const keys = Object.keys(row);
    const allEmptyCols = keys.every(k => k.startsWith("__EMPTY"));
    if (allEmptyCols) return false;

    // 🔥 Regla nueva: si la columna "N°" está vacía, se elimina la fila
    if ("N°" in row && String(row["N°"]).trim() === "") {
      return false;
    }

    return true;
  });
}


/* -----------------------
   Renderiza tabla desde JSON
   ----------------------- */
function renderTablaFromJson(data, title = "Tabla") {
  currentData = Array.isArray(data) ? data : null;
  currentTitle = title;

  const content = document.getElementById("content");
  if (!content) return;

  const container = document.createElement("div");
  container.className = "container section";

  // botón regresar
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

  // tabla
  const table = document.createElement("table");
  table.className = "tabla-inventario";

  const caption = document.createElement("caption");
  caption.textContent = title;
  table.appendChild(caption);

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

  // botón descarga
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

  content.replaceChildren(container);
}

/* -----------------------
   Exportar JSON a XLSX
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
   Lógica para abrir tabla
   ----------------------- */
async function handleTablaClick(tabla) {
  if (!tabla) return;
  const content = document.getElementById("content");
  if (!content) return;

  try {
    history.replaceState(null, "", `#${HASH_PREFIX}${encodeURIComponent(tabla)}`);
  } catch (err) {}

  // 1) archivo individual
  const candidatePath = `src/excel/${tabla}.xlsx`;
  let json = await fetchExcelToJson(candidatePath);
  if (json) {
    json = cleanExcelJson(json);
    if (json.length > 0) {
      renderTablaFromJson(json, tabla);
      return;
    }
  }

  // 2) Monitores.xlsx filtrado
  const monitoresPath = `src/excel/Monitores.xlsx`;
  const monData = await fetchExcelToJson(monitoresPath);
  if (monData && monData.length > 0) {
    const filtered = monData.filter(row => {
      return Object.values(row).some(v => String(v).toLowerCase().includes(tabla.toLowerCase()));
    });
    if (filtered.length > 0) {
      renderTablaFromJson(filtered, `${tabla} (desde Monitores.xlsx)`);
      return;
    }
  }

  // 3) fallback
  if (tablasFallback[tabla]) {
    const tpl = document.createElement("template");
    tpl.innerHTML = tablasFallback[tabla].trim();
    const node = tpl.content.firstElementChild;

    // asignar evento al botón del fallback
    const backBtn = node.querySelector("[data-back]");
    if (backBtn) backBtn.addEventListener("click", goToInventario);

    content.replaceChildren(node);
    currentData = null;
    currentTitle = tabla;
    return;
  }

  // 4) error
  content.replaceChildren((() => {
    const div = document.createElement("div");
    div.className = "container";
    div.innerHTML = `<p>No hay datos para ${tabla}</p>`;
    return div;
  })());
  currentData = null;
  currentTitle = tabla;
}

/* -----------------------
   Delegación de eventos
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
  }
});

/* -----------------------
   Inicialización
   ----------------------- */
function parseHash() {
  const full = (window.location.hash || "").slice(1);
  if (!full) return null;
  if (full === "inventario") return { section: "inventario" };
  if (full.startsWith(HASH_PREFIX)) {
    const encoded = full.slice(HASH_PREFIX.length);
    try {
      const tabla = decodeURIComponent(encoded);
      return { section: "inventario", tabla };
    } catch {
      return { section: "inventario" };
    }
  }
  return null;
}

window.addEventListener("DOMContentLoaded", () => {
  const parsed = parseHash();
  if (parsed && parsed.section === "inventario" && parsed.tabla) {
    handleTablaClick(parsed.tabla);
  }
});
