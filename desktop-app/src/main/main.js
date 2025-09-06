const { app, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // Allow loading external resources like Firebase
    },
    icon: path.join(__dirname, '../renderer/assets/icon.png'), // Optional: add an icon later
    show: false // Don't show until ready
  })

  // Load the main index.html file
  win.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show()
  })

  // Open DevTools in development (remove in production)
  // win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
})