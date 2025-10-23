// src/barraBusqueda.js

// Array global para almacenar el índice de búsqueda
let indexBusqueda = [];

// Categorías y labs que quieres indexar
const categorias = ["Monitores", "Teclados", "Escritorios", "Pcs"];
const labs = ["Lab-1A","Lab-1B","Lab-1C","Lab-1D","Lab-1E","Lab-2A","Lab-2B","Lab-2C","Lab-3B"];

// Inicializar buscador cuando cargue la página
window.addEventListener("DOMContentLoaded", async () => {
  await construirIndiceBusqueda();
  inicializarBuscador();
});

// -----------------------
// 🔍 Construcción del índice
// -----------------------
async function construirIndiceBusqueda() {
  indexBusqueda = [];

  for (const categoria of categorias) {
    for (const lab of labs) {
      const url = `src/word/${categoria}/${lab}.docx`;
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;

        const buffer = await resp.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const html = result.value || "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const table = doc.querySelector("table");
        if (!table) continue;

        const rows = Array.from(table.querySelectorAll("tr"));
        if (rows.length < 2) continue;

        // columnas
        const headers = Array.from(rows[0].querySelectorAll("td,th"))
          .map(c => (c.textContent || "").trim().toLowerCase());

        const modeloIdx = headers.findIndex(h => h.includes("modelo"));
        const patrIdx = headers.findIndex(h => h.includes("patrimonio"));

        if (modeloIdx === -1 && patrIdx === -1) continue;

        rows.slice(1).forEach(row => {
          const cells = Array.from(row.querySelectorAll("td,th"));
          const modelo = modeloIdx !== -1 ? (cells[modeloIdx]?.textContent || "").trim() : "";
          const patrimonio = patrIdx !== -1 ? (cells[patrIdx]?.textContent || "").trim() : "";

          if (modelo || patrimonio) {
            indexBusqueda.push({
              categoria,
              lab,
              modelo,
              patrimonio
            });
          }
        });
      } catch (err) {
        console.warn("Error al indexar:", url, err);
      }
    }
  }

  console.log("✅ Índice construido con", indexBusqueda.length, "items");
}

// -----------------------
// 🎯 Inicializar buscador
// -----------------------
function inicializarBuscador() {
  const input = document.getElementById("buscador");
  const resultadosDiv = document.getElementById("resultados-busqueda");

  if (!input || !resultadosDiv) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    resultadosDiv.innerHTML = "";

    if (!query) {
      resultadosDiv.style.display = "none";
      return;
    }

    // 🔥 Coincidencia exacta desde el inicio
    const matches = indexBusqueda.filter(item =>
      (item.modelo && item.modelo.toLowerCase().startsWith(query)) ||
      (item.patrimonio && item.patrimonio.toLowerCase().startsWith(query))
    );

    if (matches.length === 0) {
      resultadosDiv.style.display = "block";
      resultadosDiv.innerHTML = `<div class="resultado-item">Sin resultados</div>`;
      return;
    }

    resultadosDiv.style.display = "block";

    matches.slice(0, 20).forEach(item => {
      const div = document.createElement("div");
      div.className = "resultado-item";

      let tituloPrincipal = item.modelo;
      let detalleSecundario = `P: ${item.patrimonio}`;

      // 🔥 Si el patrimonio es el que coincide, invertir el orden
      if (item.patrimonio && item.patrimonio.toLowerCase().startsWith(query)) {
        tituloPrincipal = item.patrimonio;
        detalleSecundario = `M: ${item.modelo}`;
      }

      div.innerHTML = `
        <div class="resultado-texto">
          <div class="resultado-titulo">${tituloPrincipal}</div>
          <div class="resultado-detalle">${item.categoria} · ${item.lab} · ${detalleSecundario}</div>
        </div>
        <button class="abrir-btn" data-cat="${item.categoria}" data-lab="${item.lab}">Abrir</button>
      `;


      div.querySelector(".abrir-btn").addEventListener("click", () => {
        // Actualiza el hash a la tabla correspondiente
        location.hash = `inventario.${item.categoria}/${item.lab}`;
        // 🔥 Refresca la página para que cargue el contenido
        location.reload();
      });


      resultadosDiv.appendChild(div);
    });
  });
}
