import { Menu } from 'electron'

export class CustomMenu {
    private loadUrl: (url: string) => Promise<void>
    private createChildWindow: () => void

    constructor(loadUrl: (url: string) => Promise<void>, createChildWindow: () => void) {
        this.loadUrl = loadUrl
        this.createChildWindow = createChildWindow
        this.setupMenu()
    }

    private setupMenu(): void {
        const menu = Menu.buildFromTemplate([
            {
                label: 'Navigation',
                submenu: [
                    {
                        label: 'Claude AI',
                        accelerator: 'CmdOrCtrl+1',
                        click: (): void => {
                            this.loadUrl('https://claude.ai')
                        }
                    },
                    {
                        label: 'ChatGPT',
                        accelerator: 'CmdOrCtrl+2',
                        click: (): void => {
                            this.loadUrl('https://chat.openai.com')
                        }
                    },
                    {
                        label: 'Gemini',
                        accelerator: 'CmdOrCtrl+3',
                        click: (): void => {
                            this.loadUrl('https://gemini.google.com')
                        }
                    },
                    {
                        label: 'Pluto',
                        accelerator: 'CmdOrCtrl+4',
                        click: (): void => {
                            this.loadUrl('https://plutoai.telekom.intra')
                        }
                    },
                    {
                        label: 'DeepSeek',
                        accelerator: 'CmdOrCtrl+5',
                        click: (): void => {
                            this.loadUrl('https://chat.deepseek.com')
                        }
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { type: 'separator' },
                    { role: 'toggleDevTools' }
                ]
            },
            {
                label: 'Settings',
                click: (): void => {
                    this.createChildWindow()
                }
            }
        ])

        Menu.setApplicationMenu(menu)
    }
}
