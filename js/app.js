const API_BASE = 'https://api.mail.tm'
const STORAGE_KEY = 'tempmailpro'

let token = ''
let messages = []
let storedAddress = ''

const emailDisplay = document.getElementById('emailDisplay')
const generateBtn = document.getElementById('generateBtn')
const copyBtn = document.getElementById('copyBtn')
const refreshBtn = document.getElementById('refreshBtn')
const inboxList = document.getElementById('inboxList')
const mailCount = document.getElementById('mailCount')
const emailModal = document.getElementById('emailModal')
const emailSubject = document.getElementById('emailSubject')
const emailFrom = document.getElementById('emailFrom')
const emailDate = document.getElementById('emailDate')
const emailBody = document.getElementById('emailBody')
const backBtn = document.getElementById('backBtn')
const deleteBtn = document.getElementById('deleteBtn')
const loading = document.getElementById('loading')
const toast = document.getElementById('toast')

function saveState() {
    const toSave = messages.map(m => ({ id: m.id, from: m.from, subject: m.subject, date: m.date }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, messages: toSave, address: storedAddress }))
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
        if (saved && saved.address) {
            token = saved.token || ''
            messages = saved.messages || []
            storedAddress = saved.address || ''
            return true
        }
    } catch (e) {}
    return false
}

async function api(path, opts = {}) {
    const headers = {}
    if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
    const text = await res.text()
    if (!res.ok) throw new Error(text)
    return text ? JSON.parse(text) : null
}

function showLoading(show) {
    loading.classList.toggle('active', show)
}

function showToast(msg) {
    toast.textContent = msg
    toast.classList.add('active')
    setTimeout(() => toast.classList.remove('active'), 2500)
}

function randStr(n) {
    const c = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let r = ''
    for (let i = 0; i < n; i++) r += c[Math.floor(Math.random() * c.length)]
    return r
}

async function generateEmail() {
    emailDisplay.textContent = 'Generating...'
    copyBtn.disabled = true
    showLoading(true)
    try {
        const domains = await api('/domains')
        const domain = domains['hydra:member'][0].domain
        const address = `${randStr(8)}${randStr(4)}@${domain}`
        const password = randStr(16)

        await api('/accounts', {
            method: 'POST',
            body: JSON.stringify({ address, password })
        })

        const tok = await api('/token', {
            method: 'POST',
            body: JSON.stringify({ address, password })
        })

        token = tok.token || tok.id
        storedAddress = address
        messages = []
        saveState()

        emailDisplay.innerHTML = address
        copyBtn.disabled = false
        renderInbox()
        showToast('Email generated!')
    } catch (err) {
        showToast('Failed. Try again.')
        emailDisplay.innerHTML = '<span class="placeholder">Click to generate</span>'
    } finally {
        showLoading(false)
    }
}

async function fetchInbox() {
    if (!token) return
    try {
        const data = await api('/messages?page=1')
        const newMsgs = data['hydra:member'] || []
        const existingIds = new Set(messages.map(m => m.id))
        let added = 0
        for (const m of newMsgs) {
            if (!existingIds.has(m.id)) { messages.push(m); added++ }
        }
        if (added || newMsgs.length === 0) {
            messages.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            saveState()
            renderInbox()
            if (added) showToast(`${added} new!`)
        }
    } catch (err) {
        console.error(err)
    }
}

function renderInbox() {
    inboxList.innerHTML = ''
    if (!messages.length) {
        inboxList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                </svg>
                <p>No emails yet</p>
                <span>Emails will appear here automatically</span>
            </div>
        `
        mailCount.textContent = '0 messages'
        return
    }
    mailCount.textContent = `${messages.length} message${messages.length > 1 ? 's' : ''}`
    messages.forEach((msg, i) => {
        const item = document.createElement('div')
        item.className = 'mail-item unread'
        item.innerHTML = `
            <span class="mail-index">${i + 1}</span>
            <div class="mail-content">
                <div class="mail-sender">${escapeHtml(msg.from?.address || msg.from?.name || msg.from)}</div>
                <div class="mail-subject">${escapeHtml(msg.subject)}</div>
            </div>
            <span class="mail-time">${timeAgo(msg.createdAt || msg.date)}</span>
        `
        item.addEventListener('click', () => openEmail(msg.id))
        inboxList.appendChild(item)
    })
}

async function openEmail(id) {
    if (!token) return
    showLoading(true)
    try {
        const msg = await api(`/messages/${id}`)
        emailSubject.textContent = msg.subject || '(No Subject)'
        emailFrom.textContent = msg.from?.address || msg.from?.name || 'Unknown'
        emailDate.textContent = msg.createdAt || msg.date || ''
        emailBody.innerHTML = msg.html?.[0] || msg.text?.[0]?.replace(/\n/g, '<br>') || '<i>(No content)</i>'
        emailModal.classList.add('active')
    } catch (err) {
        showToast('Failed')
    } finally {
        showLoading(false)
    }
}

function closeEmail() { emailModal.classList.remove('active') }

function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString()
}

function escapeHtml(text) {
    const d = document.createElement('div')
    d.textContent = text || ''
    return d.innerHTML
}

generateBtn.addEventListener('click', generateEmail)
copyBtn.addEventListener('click', () => {
    const email = emailDisplay.textContent
    if (email?.includes('@')) {
        navigator.clipboard.writeText(email).then(() => showToast('Copied!'))
        .catch(() => navigator.clipboard.writeText(email))
    }
})
refreshBtn.addEventListener('click', () => { fetchInbox(); showToast('Checking...') })
backBtn.addEventListener('click', closeEmail)
deleteBtn.addEventListener('click', closeEmail)
emailModal.addEventListener('click', e => { if (e.target === emailModal) closeEmail() })

if (loadState()) {
    emailDisplay.innerHTML = storedAddress
    copyBtn.disabled = false
    renderInbox()
} else {
    generateEmail()
}
