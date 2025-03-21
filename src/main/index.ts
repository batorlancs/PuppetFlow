import { app, shell, BrowserWindow, ipcMain, globalShortcut, BrowserView } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PuppeteerHandler } from './components/puppeteer-handler'
import { CustomTray } from './components/tray'
import { CustomMenu } from './components/menu'

let currentUrl = 'https://claude.ai' // Default URL
let mainWindow: BrowserWindow | null = null
const puppeteerHandler = new PuppeteerHandler()

async function createWindow(): Promise<void> {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: false, // Show menu bar to contain our URL options
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true
        }
    })

    // Add certificate error handler
    mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
        // Accept all certificates for internal domains
        if (request.hostname.includes('telekom.intra')) {
            callback(0) // 0 means success
        } else {
            callback(-3) // Use default verification
        }
    })

    new CustomMenu(loadUrl, () => {
        console.log('Creating child window')
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow!.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (process.env.ELECTRON_RENDERER_URL) {
        await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
        await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // Load the default URL
    await loadUrl(currentUrl)

    setTimeout(async () => {
        await loadUrl('https://chat.openai.com')
    }, 2000)

    // Handle window close to hide instead of quit
    mainWindow.on('close', (event) => {
        if (mainWindow && !app.isQuitting) {
            event.preventDefault()
            mainWindow.hide()
            return false
        }
        return true
    })
}

// Function to load URL and update current URL state
async function loadUrl(url: string): Promise<void> {
    if (mainWindow) {
        currentUrl = url
        mainWindow.loadURL(url)

        // Get puppeteer page after loading URL
        try {
            puppeteerHandler.updatePage(mainWindow)
        } catch (error) {
            console.error('Failed to get puppeteer page:', error)
        }
    }
}

// Register global shortcut - using Alt+Shift+G which is unlikely to be used by other apps
function registerGlobalShortcut(): void {
    globalShortcut.register('CommandOrControl+Space', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide()
            } else {
                mainWindow.show()
                mainWindow.focus()
            }
        }
    })
    // Remove the global Enter shortcut and use webContents instead
    if (mainWindow) {
        // Listen for keyboard events on the webContents
        mainWindow.webContents.on('before-input-event', (event, input) => {
            console.log('Before input event happened')
            if (
                input.type === 'keyDown' &&
                input.key === 'Enter' &&
                !input.control &&
                !input.meta &&
                !input.alt &&
                !input.shift
            ) {
                ;(async (): Promise<void> => {
                    try {
                        if (puppeteerHandler.page && currentUrl.includes('chat.openai.com')) {
                            console.log('Chat.openai.com -> send enter')
                            // Prevent default behavior to handle it ourselves
                            event.preventDefault()
                            try {
                                await puppeteerHandler.page.click('[data-testid="send-button"]')
                            } catch {
                                // its ok if it fails
                            }
                        } else if (puppeteerHandler.page) {
                            // await page.keyboard.press('Enter')
                        }
                    } catch (error) {
                        console.error('Error handling Enter key:', error)
                    }
                })()
            }
        })
    }
}

// Set app to launch at startup
function setAutoLaunch(enabled: boolean): void {
    if (process.platform === 'darwin' || process.platform === 'win32') {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            // On macOS, this opens the app in the background
            openAsHidden: true,
            // Add path for Windows to ensure correct executable is launched
            path: process.execPath
        })
    }
}

// Function to check if auto-launch is enabled
function isAutoLaunchEnabled(): boolean {
    if (process.platform === 'darwin' || process.platform === 'win32') {
        const settings = app.getLoginItemSettings()
        return settings.openAtLogin
    }
    return false
}

// Initialize puppeteer before app is ready
;(async (): Promise<void> => {
    try {
        console.log('Initializing puppeteer before app is ready...')
        await puppeteerHandler.initialize(app)
        console.log('Puppeteer initialized successfully, continuing with app startup')

        // Now that puppeteer is initialized, we can proceed with app.whenReady()
        app.whenReady().then(async () => {
            // Set app user model id for windows
            electronApp.setAppUserModelId('com.electron')

            // Default open or close DevTools by F12 in development
            // and ignore CommandOrControl + R in production.
            // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
            app.on('browser-window-created', (_, window) => {
                optimizer.watchWindowShortcuts(window)
            })

            // Add custom property to app
            app.isQuitting = false

            // Create window and tray immediately since puppeteer is already initialized
            createWindow()
            new CustomTray(icon, mainWindow, app)
            registerGlobalShortcut()
            setAutoLaunch(true)

            app.on('activate', function () {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (BrowserWindow.getAllWindows().length === 0) createWindow()
            })

            // Handle IPC messages
            ipcMain.on('ping', () => {
                console.log('Received ping from renderer')
            })

            // Add IPC handler to toggle auto-launch setting
            ipcMain.handle('toggle-auto-launch', (_event, enabled) => {
                setAutoLaunch(enabled)
                return isAutoLaunchEnabled()
            })

            // Add a new handler to just check the status
            ipcMain.handle('get-auto-launch-status', () => {
                return isAutoLaunchEnabled()
            })
        })
    } catch (error) {
        console.error('An error occurred while initializing the app:', error)
        app.quit()
    }
})()

// Handle before-quit to set the isQuitting flag
app.on('before-quit', () => {
    app.isQuitting = true
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Clean up global shortcuts and puppeteer when app is about to quit
app.on('will-quit', async () => {
    globalShortcut.unregisterAll()
    await puppeteerHandler.close()
})
