const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
require('@electron/remote/main').initialize()

const { Menu, MenuItem } = require('electron')
const menu = new Menu()
menu.append(new MenuItem(
    {
        label: 'Tools',
        submenu: [
            {
                label: 'DevTools',
                role: 'toggleDevTools',
                accelerator: process.platform === 'darwin' ? 'Ctrl+T' : 'Ctrl+T'
            },
            {
                label: 'Manual',
                click: () => {
                    dialog.showMessageBox(
                        {
                            title: "Keyboard Shortcuts",
                            message: "q : set start\ne : set end\nr : push current annotation into state dict then you can start a new annotation\nw: save annotations.json to selected directory\n   every 20s automaticlly save\n   right bottom first button displays save signal\n\nspace : pause and start video\n\nctrl+i : load video directory\n\nctrl+t : toggleDevTools\n\nctrl+h : Manual\n\n Please finish current annotation and press 'r', if you want to modify or remove previous annotation!"
                        }
                    );
                },
                accelerator: process.platform === 'darwin' ? 'Ctrl+H' : 'Ctrl+H'
            }
        ]
    }
))
Menu.setApplicationMenu(menu)

function createWindow () {
    const win = new BrowserWindow({
        width: 1280,
        height: 680,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    })

    win.loadURL(`file://${__dirname}/index.html`)
}

app.whenReady().then(() => {
    console.log("Starting application")
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
