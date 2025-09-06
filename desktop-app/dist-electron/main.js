import { app as n, BrowserWindow as i } from "electron";
import { fileURLToPath as a } from "node:url";
import o from "node:path";
const r = o.dirname(a(import.meta.url));
process.env.APP_ROOT = o.join(r, "..");
const t = process.env.VITE_DEV_SERVER_URL, f = o.join(process.env.APP_ROOT, "dist-electron"), s = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = t ? o.join(process.env.APP_ROOT, "public") : s;
let e;
function l() {
  e = new i({
    width: 900,
    height: 670,
    autoHideMenuBar: !0,
    darkTheme: !0,
    title: "JyAnime",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#00000000",
      symbolColor: "#ffffff",
      height: 40
    },
    trafficLightPosition: { x: 10, y: 10 },
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      webSecurity: !1,
      preload: o.join(r, "preload.mjs")
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), t ? e.loadURL(t) : e.loadFile(o.join(s, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), e = null);
});
n.on("activate", () => {
  i.getAllWindows().length === 0 && l();
});
n.whenReady().then(l);
export {
  f as MAIN_DIST,
  s as RENDERER_DIST,
  t as VITE_DEV_SERVER_URL
};
