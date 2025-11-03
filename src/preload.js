// ==================================================
// Messengy — preload.js (Native Passkey + Notification Bridge)
// ==================================================

const { contextBridge, ipcRenderer } = require("electron");

// 🧩 API bridge สำหรับการแจ้งเตือนจากเว็บ
contextBridge.exposeInMainWorld("messengy", {
  notify: (title, body) => ipcRenderer.send("notify", { title, body }),
});

// ==================================================
// 1. Notification Bridge (เว็บ → Native Notification)
// ==================================================
(() => {
  const OldNotification = window.Notification;
  window.Notification = function (title, options) {
    ipcRenderer.send("notify", { title, body: options?.body || "" });
    return new OldNotification(title, options);
  };
  Object.defineProperty(window.Notification, "permission", { get: () => "granted" });
  window.Notification.requestPermission = async () => "granted";
})();

// ==================================================
// 2. Enable System Autofill & Passkey Detection
// ==================================================
window.addEventListener("DOMContentLoaded", () => {
  console.log("[Messengy] preload active: enabling native password/passkey detection");

  // ✅ ปล่อยให้ระบบ browser ภายใน Electron (Chromium) จัดการ autofill เอง
  // โดยไม่แตะต้อง input หรือสร้างปุ่ม overlay เพิ่ม
  // → ระบบ Keychain / Windows Hello / Chrome Password Manager
  // จะเห็นว่าเป็นเว็บจริงและแสดง UI ของมันเองได้
});
