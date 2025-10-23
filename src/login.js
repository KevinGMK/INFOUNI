// src/login.js
window.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  const errorMsg = document.getElementById("login-error");

  if (!loginScreen) {
    console.warn("login.js: #login-screen no está presente en el DOM. El script sigue activo pero no podrá mostrar/ocultar el overlay.");
  }
  if (!loginBtn) {
    console.warn("login.js: #login-btn no está presente en el DOM. El botón de login no funcionará.");
  }

  // ====== Usuarios permitidos (username, password, displayName) ======
  // Puedes añadir/quitar usuarios aquí sin tocar la lógica.
  const USERS = [
    { username: "Maximo", password: "ing123", name: "Ingeniero" },
    { username: "Roberto", password: "prof123", name: "Profesor"  },
    { username: "Supervisor", password: "123456789", name: "Supervisor" }
  ];

  // Duración de sesión por defecto (2 minutos).
  // Para pruebas rápidas añade ?test=1 al URL -> duración 15s
  //const defaultDurationMs = 1 * 60 * 1000;
  const defaultDurationMs = 60 * 1000;
  const testMode = new URLSearchParams(window.location.search).get("test") === "1";
  const SESSION_DURATION = testMode ? 15 * 1000 : defaultDurationMs;

  let tickInterval = null;
  let lastLoggedSeconds = null;
  let loggedInitial = false;

  function msToHuman(ms) {
    if (ms <= 0) return "0s";
    const s = Math.floor(ms / 1000);
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  function expireSession(_silent = false) {
    if (!_silent) console.log("Sesion cerrada Correctamente");
    try {
      localStorage.removeItem("sesionActiva");
      localStorage.removeItem("sesionExpira");
      localStorage.removeItem("sesionUser");
    } catch (e) {
      console.warn("login.js: error limpiando localStorage", e);
    }

    // mostrar overlay si existe
    if (loginScreen) loginScreen.style.display = "flex";
    // parar intervalos
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    lastLoggedSeconds = null;
    loggedInitial = false;

    // emitir evento por si otra parte de la app quiere reaccionar
    window.dispatchEvent(new CustomEvent("session-expired"));
  }

  function remainingMs() {
    const exp = parseInt(localStorage.getItem("sesionExpira") || "0", 10);
    if (!exp || isNaN(exp)) return -1;
    return exp - Date.now();
  }

  function tick() {
    const rem = remainingMs();
    if (rem <= 0) {
      // si ya expiró -> cerrar
      expireSession();
      return;
    }

    // log inicial (solo 1 vez después de iniciar o recargar)
    if (!loggedInitial) {
      const user = localStorage.getItem("sesionUser") || "unknown";
      console.log(`Sesión para '${user}' expira en ${msToHuman(rem)} (timestamp ${localStorage.getItem("sesionExpira")})`);
      loggedInitial = true;
    }

    const remainSec = Math.ceil(rem / 1000);

    // imprimir "Expirando en 3/2/1" justo cuando corresponda
    if (remainSec <= 3 && remainSec >= 1 && remainSec !== lastLoggedSeconds) {
      console.log(`Expirando en ${remainSec}`);
    }

    lastLoggedSeconds = remainSec;
  }

  function startTicking() {
    if (tickInterval) clearInterval(tickInterval);
    // tick inmediato y luego cada segundo
    tick();
    tickInterval = setInterval(tick, 1000);
  }

  // Comprueba sesión al cargar
  (function initialCheck() {
    const sesionActiva = localStorage.getItem("sesionActiva") === "true";
    const expRaw = localStorage.getItem("sesionExpira");
    if (sesionActiva && expRaw) {
      const rem = remainingMs();
      if (rem > 0) {
        // sesión válida
        if (loginScreen) loginScreen.style.display = "none";
        console.log("Sesion activa encontrada en localStorage. Usuario:", localStorage.getItem("sesionUser") || "unknown");
        startTicking();
        return;
      } else {
        // expiró
        console.log("Sesion encontrada pero ya expiró (al cargar). Forzando cierre.");
        expireSession();
        return;
      }
    } else {
      // no hay sesión: asegurar overlay visible
      if (loginScreen) loginScreen.style.display = "flex";
    }
  })();

  // Handler del botón de login
  if (loginBtn) {
    loginBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const u = (document.getElementById("user")?.value || "").trim();
      const p = (document.getElementById("pass")?.value || "").trim();

      // buscar usuario
      const found = USERS.find(it => it.username === u && it.password === p);

      if (found) {
        const expiresAt = Date.now() + SESSION_DURATION;
        try {
          localStorage.setItem("sesionActiva", "true");
          localStorage.setItem("sesionExpira", String(expiresAt));
          localStorage.setItem("sesionUser", found.name || found.username);
        } catch (e) {
          console.warn("login.js: no se pudo escribir en localStorage", e);
        }

        if (loginScreen) loginScreen.style.display = "none";
        if (errorMsg) errorMsg.style.display = "none";

        // reset logs y arrancar tick
        loggedInitial = false;
        lastLoggedSeconds = null;
        console.log(`Login OK — usuario '${found.name}' — sesión iniciada. Expira en ${msToHuman(SESSION_DURATION)} (timestamp ${expiresAt}).`);
        startTicking();

        // emitir evento por si otras partes quieren reaccionar al login
        window.dispatchEvent(new CustomEvent("session-started", { detail: { expiresAt, user: found.name } }));
      } else {
        if (errorMsg) errorMsg.style.display = "block";
        console.log("Intento de login fallido para usuario:", u);
      }
    });
  }

  // Logout público para llamar desde consola o UI
  window.logoutSession = function() {
    expireSession();
    console.log("logoutSession() ejecutado.");
  };

  // Por seguridad: si cierras pestaña o recargas no hacemos nada especial (la expiración queda en localStorage).
  // Pero permitimos forzar cierre desde consola: window.expireSession && window.expireSession()
  window.expireSession = expireSession;
});
