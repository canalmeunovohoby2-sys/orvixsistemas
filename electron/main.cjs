/**
 * ORVIX PDV — Processo principal do Electron.
 *
 * Estratégia: o app nativo carrega a aplicação web SSR já publicada
 * (https://orvixsistemas.lovable.app ou o domínio customizado configurado
 * em ORVIX_APP_URL). Isso preserva 100% das regras de negócio, autenticação
 * Supabase, permissões e APIs do sistema — nada precisa ser reescrito.
 *
 * O shell nativo adiciona:
 *   - Janela dedicada, sem chrome de navegador.
 *   - Impressão silenciosa via webContents.print({ silent: true }).
 *   - Auto-update (electron-updater) — habilitado no pipeline de release.
 *   - Bridge segura (contextIsolation + preload) exposta em window.orvix.
 */

const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
const path = require("node:path");

const APP_URL = process.env.ORVIX_APP_URL || "https://orvixsistemas.lovable.app/login";
const APP_NAME = "ORVIX Sistemas";

// Instância única — impede que o operador abra dois PDVs ao mesmo tempo.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}

let mainWindow = /** @type {BrowserWindow | null} */ (null);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1120,
    minHeight: 680,
    backgroundColor: "#0a0a0a",
    title: APP_NAME,
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.removeMenu();

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
    // Prioridade alta no Windows para evitar starvation do PDV.
    try {
      const pid = mainWindow?.webContents.getOSProcessId();
      if (process.platform === "win32" && pid) {
        // Requer permissão do SO — silencioso em caso de falha.
        require("child_process").exec(`wmic process where ProcessId=${pid} CALL setpriority "high priority"`, () => {});
      }
    } catch { /* noop */ }
  });

  mainWindow.on("closed", () => { mainWindow = null; });

  // Links externos → navegador padrão do sistema.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Sinaliza para a web app que estamos em ambiente nativo (UA custom).
  mainWindow.webContents.setUserAgent(
    mainWindow.webContents.getUserAgent() + ` OrvixPDV/${app.getVersion()}`,
  );

  mainWindow.loadURL(APP_URL);
}

// Impressão silenciosa: recebe HTML pronto do renderer e imprime na
// impressora padrão sem abrir diálogo. Retorna { ok, error? }.
ipcMain.handle("orvix:print-silent", async (_event, html) => {
  if (typeof html !== "string" || html.length === 0) {
    return { ok: false, error: "HTML inválido para impressão." };
  }
  return await new Promise((resolve) => {
    const printer = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
    });
    printer.webContents.once("did-finish-load", () => {
      printer.webContents.print(
        {
          silent: true,
          printBackground: true,
          margins: { marginType: "none" },
          pageSize: { width: 80000, height: 297000 }, // 80mm cupom
        },
        (success, failureReason) => {
          try { printer.close(); } catch { /* noop */ }
          resolve({ ok: success, error: success ? undefined : failureReason });
        },
      );
    });
    printer.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
});

ipcMain.handle("orvix:app-version", () => app.getVersion());
ipcMain.handle("orvix:platform", () => process.platform);

// -----------------------------------------------------------------------
// AUTO-UPDATE (electron-updater) — instale a dep no pipeline de release.
// Fundação já configurada; ativar setando ORVIX_UPDATES=1 e publicando o
// feed (GitHub Releases / S3) via electron-builder.
// -----------------------------------------------------------------------
if (process.env.ORVIX_UPDATES === "1") {
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    let lastStatus = "none";
    autoUpdater.on("checking-for-update", () => { lastStatus = "checking"; });
    autoUpdater.on("update-available", () => { lastStatus = "available"; });
    autoUpdater.on("update-not-available", () => { lastStatus = "none"; });
    autoUpdater.on("update-downloaded", () => { lastStatus = "downloaded"; });
    autoUpdater.on("error", () => { lastStatus = "error"; });
    ipcMain.handle("orvix:update-status", () => lastStatus);
    ipcMain.handle("orvix:quit-and-install", () => autoUpdater.quitAndInstall(false, true));
    app.whenReady().then(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
      // Verifica de hora em hora.
      setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 60 * 60 * 1000);
    });
  } catch (e) {
    console.warn("[orvix] electron-updater não instalado; auto-update desabilitado.");
  }
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(() => {
  // Content-Security frame permissions — nada além da origem oficial.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    // Concede acesso a impressoras / clipboard sem prompt (app confiável).
    const allowed = ["clipboard-read", "clipboard-sanitized-write", "media"];
    cb(allowed.includes(permission));
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});