const MAILTM = {
    _token: null,
    _account: null,

    async _fetch(url, opts) {
        const r = await fetch(url, opts)
        const text = await r.text()
        if (!r.ok || !text) throw new Error(text || `HTTP ${r.status}`)
        try { return JSON.parse(text) } catch (e) { throw new Error(`Invalid JSON: ${text.slice(0, 100)}`) }
    },

    async generate() {
        const doms = await this._fetch('https://api.mail.tm/domains')
        const domain = doms['hydra:member']?.[0]?.domain || doms[0]?.domain
        if (!domain) throw new Error('No available domains')

        const local = Math.random().toString(36).slice(2, 10)
        const password = Math.random().toString(36).slice(2, 12)
        const address = `${local}@${domain}`

        const acct = await this._fetch('https://api.mail.tm/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        })

        const tok = await this._fetch('https://api.mail.tm/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        })

        this._token = tok.token || tok['hydra:member']?.token
        this._account = acct

        return { address, password, provider: 'mail.tm' }
    },

    async checkInbox() {
        if (!this._token) return []
        try {
            const data = await this._fetch('https://api.mail.tm/messages', {
                headers: { Authorization: `Bearer ${this._token}` }
            })
            const list = data['hydra:member'] || data || []
            return Array.isArray(list) ? list.map(m => ({
                id: m.id,
                from: m.from?.address || m.from?.name || 'Unknown',
                subject: m.subject || '(No Subject)',
                date: m.createdAt || ''
            })) : []
        } catch (e) { return [] }
    },

    async readMessage(id) {
        if (!this._token) throw new Error('Not authenticated')
        const data = await this._fetch(`https://api.mail.tm/messages/${id}`, {
            headers: { Authorization: `Bearer ${this._token}` }
        })
        return {
            id: data.id,
            from: data.from?.address || 'Unknown',
            subject: data.subject || '(No Subject)',
            date: data.createdAt || '',
            htmlBody: data.html?.[0] || '',
            textBody: data.text?.[0] || data.intro || ''
        }
    }
}
