export default async function handler(req, res) {
    const params = new URLSearchParams(req.query).toString()
    try {
        const r = await fetch(`https://www.1secmail.com/api/v1/?${params}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const text = await r.text()
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.status(r.status).send(text)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
}
