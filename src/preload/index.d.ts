import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            onUrlChange: (callback: (url: string) => void) => void
        }
    }
}
