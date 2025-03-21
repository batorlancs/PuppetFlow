import { useEffect, useState } from 'react'

function App(): JSX.Element {
    const [url, setUrl] = useState('https://www.google.com')

    useEffect(() => {
        window.api.onUrlChange((url) => {
            setUrl(url)
        })
    }, [])

    return (
        <div className="h-screen w-full bg-neutral-800">
            <div className="h-12 w-full flex items-center justify-center">
                <p className="text-white">{url}</p>
            </div>
            <webview src={url} className="h-full w-full" />
        </div>
    )
}

export default App
