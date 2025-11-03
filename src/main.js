// ==================================================
// Messengy — Electron main.js (Passkey-Detect Ready)
// ==================================================

const {
  app, BrowserWindow, BrowserView, Menu, nativeTheme,
  Tray, Notification, globalShortcut, systemPreferences, ipcMain
} = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

// ====== ⚙️ Platform Feature Enable ======
app.commandLine.appendSwitch("enable-experimental-web-platform-features");
app.commandLine.appendSwitch("enable-webauthn");
app.commandLine.appendSwitch("webauthn-extension-enable");
app.commandLine.appendSwitch("enable-features", "PasswordManager,WebAuthn");

// ✅ App Identity
app.setAppUserModelId("com.nomsodd.messengy");

const MESSENGER_URL = "https://www.messenger.com/";
let win, tray, messengerView, titleView;

// 🧩 Notification Permission (macOS Ventura+)
async function requestNotificationPermission() {
  if (!Notification.isSupported()) return;
  try {
    const permission = await Notification.requestPermission?.();
    console.log(`[Messengy] Notification permission: ${permission}`);
  } catch (e) {
    console.warn("[Messengy] Notification request failed:", e);
  }
}

// 🪟 Create Main Window
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hiddenInset",
    transparent: true,
    backgroundColor: "#00000000",
    vibrancy: "under-window",
    visualEffectState: "active",
    roundedCorners: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
      nativeWindowOpen: true,
      enableBlinkFeatures: "WebAuthn,PasswordManager"
    },
  });

  // 🎨 Title Bar
  titleView = new BrowserView({ webPreferences: { contextIsolation: true } });
  win.setBrowserView(titleView);
  titleView.setBounds({ x: 0, y: 0, width: 1200, height: 52 });
  titleView.webContents.loadFile(path.join(__dirname, "renderer", "title.html"));

  // 💬 Messenger View
  messengerView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      contextIsolation: true,
      enableBlinkFeatures: "WebAuthn,PasswordManager"
    },
  });
  win.addBrowserView(messengerView);

  // ✅ Set proper User-Agent for passkey / autofill
  if (process.platform === "darwin") {
    messengerView.webContents.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
    );
  } else {
    messengerView.webContents.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
    );
  }

  messengerView.setBounds({ x: 0, y: 52, width: 1200, height: 768 });
  messengerView.webContents.loadURL(MESSENGER_URL);

  // 📏 Resize Handling
  win.on("resize", () => {
    const [width, height] = win.getContentSize();
    titleView.setBounds({ x: 0, y: 0, width, height: 52 });
    messengerView.setBounds({ x: 0, y: 52, width, height: height - 52 });
  });

  // 🧭 Menu
  const menuTemplate = [
    {
      label: "Messengy",
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Theme",
          submenu: [
            { label: "Light", click: () => (nativeTheme.themeSource = "light") },
            { label: "Dark", click: () => (nativeTheme.themeSource = "dark") },
            { label: "Auto (System)", click: () => (nativeTheme.themeSource = "system") },
          ],
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" }, { role: "redo" }, { type: "separator" },
        { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Increase Text Size",
          accelerator: "CmdOrCtrl+Plus",
          click: () =>
            messengerView.webContents.setZoomFactor(
              messengerView.webContents.getZoomFactor() + 0.1
            ),
        },
        {
          label: "Decrease Text Size",
          accelerator: "CmdOrCtrl+-",
          click: () =>
            messengerView.webContents.setZoomFactor(
              messengerView.webContents.getZoomFactor() - 0.1
            ),
        },
        {
          label: "Reset Text Size",
          accelerator: "CmdOrCtrl+0",
          click: () => messengerView.webContents.setZoomFactor(1.0),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  // 🔔 Enable password-manager permission
  messengerView.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "password-manager" || permission === "webauthn") callback(true);
    else callback(false);
  });

  messengerView.webContents.session.setPermissionRequestHandler((wc, permission, callback) => {
  if (['webauthn', 'password-manager', 'notifications'].includes(permission)) {
    console.log(`[Messengy] Granting permission: ${permission}`);
    callback(true);
  } else {
    callback(false);
  }
});


  // ☁️ Auto-update
  autoUpdater.checkForUpdatesAndNotify();

  // 📱 Tray
  try {
    const trayIcon = path.join(__dirname, "assets", "icon.png");
    if (fs.existsSync(trayIcon)) {
      tray = new Tray(trayIcon);
      tray.setToolTip("Messengy");
      tray.on("click", () => (win.isVisible() ? win.hide() : win.show()));
    }
  } catch (e) {
    console.warn("[Messengy] Tray failed:", e.message);
  }
}

// ====== ⚙️ Force-enable native WebAuthn + Password Manager ======
app.commandLine.appendSwitch('enable-webauthn');
app.commandLine.appendSwitch('webauthn-extension-enable');
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('enable-features', 'WebAuthn,PasswordManager,WebAuthnPlatformAuthenticator');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream'); // กัน popup permission ที่ block หน้า login


// 🚀 Lifecycle
app.whenReady().then(async () => {
  await requestNotificationPermission();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
