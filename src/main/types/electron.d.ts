/* eslint-disable @typescript-eslint/no-unused-vars */
import { app } from 'electron'

declare global {
    namespace Electron {
        interface App {
            isQuitting: boolean
        }
    }
}
