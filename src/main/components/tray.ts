import { BrowserWindow, Tray, Menu } from 'electron'

export class CustomTray {
    private tray: Tray
    private mainWindow: BrowserWindow | null
    private app: Electron.App

    constructor(icon: string, mainWindow: BrowserWindow | null, app: Electron.App) {
        this.mainWindow = mainWindow
        this.app = app
        this.tray = new Tray(icon)
        this.setupTray()
    }

    private setupTray(): void {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show App',
                click: (): void => {
                    if (this.mainWindow) this.mainWindow.show()
                }
            },
            {
                label: 'Quit',
                click: (): void => {
                    this.app.isQuitting = true
                    this.app.quit()
                }
            },
            {
                label: 'Settings',
                click: (): void => {
                    // TODO: Open window with settings
                }
            }
        ])

        this.tray.setToolTip('Your App')
        this.tray.setContextMenu(contextMenu)

        this.tray.on('click', (): void => {
            if (this.mainWindow) {
                if (this.mainWindow.isVisible()) {
                    this.mainWindow.hide()
                } else {
                    this.mainWindow.show()
                }
            }
        })
    }
}
