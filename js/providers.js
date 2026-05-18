const MAILTM = {
    _token: null,
    _account: null,

    async generate() {
        const doms = await (await fetch('https://api.mail.tm/domains')).json()
        const domain = doms['hydra:member']?.[0]?.domain || doms[0]?.domain
        if (!domain) throw new Error('No available domains')

        const local = Math.random().toString(36).slice(2, 10)
        const password = Math.random().toString(36).slice(2, 12)
        const address = `${local}@${domain}`

        const acct = await (await fetch('https://api.mail.tm/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        })).json()

        const tok = await (await fetch('https://api.mail.tm/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        })).json()

        this._token = tok.token || tok['hydra:member']?.token
        this._account = acct

        return { address, password, provider: 'mail.tm' }
    },

    async checkInbox() {
        if (!this._token) return []
        const r = await fetch('https://api.mail.tm/messages', {
            headers: { Authorization: `Bearer ${this._token}` }
        })
        const data = await r.json()
        const list = data['hydra:member'] || data || []
        return Array.isArray(list) ? list.map(m => ({
            id: m.id,
            from: m.from?.address || m.from?.name || 'Unknown',
            subject: m.subject || '(No Subject)',
            date: m.createdAt || ''
        })) : []
    },

    async readMessage(id) {
        if (!this._token) throw new Error('Not authenticated')
        const r = await fetch(`https://api.mail.tm/messages/${id}`, {
            headers: { Authorization: `Bearer ${this._token}` }
        })
        const data = await r.json()
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
