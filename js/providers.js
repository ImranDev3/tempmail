const MAILTM = {
    _token: null,
    _account: null,

    _normalizeId(id) {
        if (!id) return null
        if (typeof id === 'string') {
            return id.replace('/messages/', '')
        }
        return null
    },

    async _fetch(url, opts) {
        const r = await fetch(url, opts)
        const text = await r.text()
        if (!r.ok) {
            let msg = `HTTP ${r.status}`
            try { const e = JSON.parse(text); msg = e.detail || e.message || msg } catch (e) {}
            throw new Error(msg)
        }
        if (!text) throw new Error('Empty response')
        try { return JSON.parse(text) } catch (e) { throw new Error('Invalid response format') }
    },

    async reAuth() {
        if (!this._account?.address || !this._account?.password) return false
        try {
            const tok = await this._fetch('https://api.mail.tm/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: this._account.address, password: this._account.password })
            })
            this._token = tok.token
            return true
        } catch (e) { return false }
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
        this._account = { address, password }

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
                id: this._normalizeId(m.id) || this._normalizeId(m['@id']),
                from: m.from?.address || m.from?.name || 'Unknown',
                subject: m.subject || '(No Subject)',
                date: m.createdAt || ''
            })).filter(m => m.id) : []
        } catch (e) { return [] }
    },

    async readMessage(id) {
        id = this._normalizeId(id)
        if (!id) throw new Error('Invalid message ID')
        if (!this._token) {
            await this.reAuth()
            if (!this._token) throw new Error('Not authenticated')
        }
        try {
            const data = await this._fetch(`https://api.mail.tm/messages/${id}`, {
                headers: { Authorization: `Bearer ${this._token}` }
            })
            return {
                id: data.id,
                from: data.from?.address || 'Unknown',
                subject: data.subject || '(No Subject)',
                date: data.createdAt || '',
                htmlBody: data.html?.[0] || data.text?.[0] || data.intro || '',
                textBody: data.text?.[0] || data.intro || ''
            }
        } catch (e) {
            if ((e.message?.includes('401') || e.message?.includes('403')) && await this.reAuth()) {
                const data = await this._fetch(`https://api.mail.tm/messages/${id}`, {
                    headers: { Authorization: `Bearer ${this._token}` }
                })
                return {
                    id: data.id,
                    from: data.from?.address || 'Unknown',
                    subject: data.subject || '(No Subject)',
                    date: data.createdAt || '',
                    htmlBody: data.html?.[0] || data.text?.[0] || data.intro || '',
                    textBody: data.text?.[0] || data.intro || ''
                }
            }
            throw e
        }
    }
}
