export default async function handler(req, res) {
    let params = ''
    if (req.query && Object.keys(req.query).length) {
        params = new URLSearchParams(req.query).toString()
    } else {
        try { params = new URL(req.url, 'http://localhost').searchParams.toString() } catch (e) {}
    }
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        const r = await fetch(`https://www.1secmail.com/api/v1/?${params}`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        clearTimeout(timeout)
        const text = await r.text()
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.status(r.status).send(text)
    } catch (e) {
        res.status(500).json({ error: e.name === 'AbortError' ? 'Request timeout' : e.message })
    }
}
