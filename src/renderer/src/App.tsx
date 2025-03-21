import { Button } from '@/components/ui/button'
import { useState } from 'react'

function App(): JSX.Element {
    const [url, setUrl] = useState('https://www.google.com')

    return (
        <div className="h-screen w-full flex items-center justify-center">
            <div className="h-12 w-full flex items-center justify-center">
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} />
                <Button>Go</Button>
            </div>
            <webview src={url} className="h-full w-full" />
        </div>
    )
}

export default App
