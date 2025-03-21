// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import puppeteer, { Browser, Page } from 'puppeteer-core'
import pie from 'puppeteer-in-electron'

export class PuppeteerHandler {
    private browser: Browser | null
    public page: Page | null

    constructor() {
        this.browser = null
        this.page = null
    }

    async initialize(app: Electron.App): Promise<void> {
        await pie.initialize(app)
        this.browser = await pie.connect(app, puppeteer)
    }

    async updatePage(mainWindow: BrowserWindow): Promise<Page> {
        if (!this.browser) {
            throw new Error('Browser not initialized')
        }
        this.page = await pie.getPage(this.browser, mainWindow)
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close()
        }
    }
}
