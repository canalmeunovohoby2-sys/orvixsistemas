/**
 * Preload seguro — expõe uma API mínima em window.orvix. contextIsolation
 * está ATIVO no BrowserWindow, então o renderer NÃO acessa Node diretamente.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("orvix", {
  version: process.env.npm_package_version || "1.0.0",
  platform: process.platform,
  printSilent: async (html) => {
    try {
      return await ipcRenderer.invoke("orvix:print-silent", html);
    } catch (err) {
      return { ok: false, error: (err && err.message) || String(err) };
    }
  },
  getUpdateStatus: () => ipcRenderer.invoke("orvix:update-status").catch(() => "none"),
  quitAndInstall: () => ipcRenderer.invoke("orvix:quit-and-install").catch(() => {}),
});

// Garantia extra de menu de contexto: escuta em fase de CAPTURA, antes
// que qualquer handler da página consiga chamar preventDefault(). Assim,
// mesmo que a tela de login (ou uma lib externa) tente desabilitar o
// clique direito, o operador continua vendo Copiar/Colar/Recortar.
window.addEventListener(
  "contextmenu",
  (event) => {
    try {
      const target = event.target;
      const isEditable = !!(
        target &&
        (target.isContentEditable ||
          (target.tagName === "INPUT" && !["button", "submit", "checkbox", "radio", "file"].includes((target.type || "").toLowerCase())) ||
          target.tagName === "TEXTAREA")
      );
      ipcRenderer.send("orvix:context-menu-fallback", { isEditable });
    } catch { /* noop */ }
  },
  true,
);