const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
    serverProcess = spawn('node', ['server.js'], { stdio: 'inherit' });
    serverProcess.on('error', (error) => {
        console.error('Sunucu başlatma hatası:', error);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadURL('https://agapp-h0oe.onrender.com');
    mainWindow.webContents.openDevTools(); // Hata ayıklama için
}

app.whenReady().then(() => {
    startServer();
    setTimeout(createWindow, 2000); // Sunucunun başlaması için 2 saniye bekle
});

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        startServer();
        createWindow();
    }
});