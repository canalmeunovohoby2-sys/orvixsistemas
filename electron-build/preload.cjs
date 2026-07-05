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