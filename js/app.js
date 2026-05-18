const API = '/api/proxy'
const STORAGE_KEY = 'tempmailpro'

let messages = []
let storedAddress = ''
let autoTimer = null

const emailDisplay = document.getElementById('emailDisplay')
const generateBtn = document.getElementById('generateBtn')
const copyBtn = document.getElementById('copyBtn')
const checkMailBtn = document.getElementById('checkMailBtn')
const inboxList = document.getElementById('inboxList')
const mailCount = document.getElementById('mailCount')
const themeToggle = document.getElementById('themeToggle')
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: toSave, address: storedAddress }))
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
        if (saved?.address) {
            messages = saved.messages || []
            storedAddress = saved.address
            return true
        }
    } catch (e) {}
    return false
}

function saveTheme(dark) {
    localStorage.setItem('tempmail_theme', dark ? 'dark' : 'light')
}

function loadTheme() {
    return localStorage.getItem('tempmail_theme') === 'dark'
}

async function fetchApi(params) {
    const res = await fetch(`${API}?${params}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}

function toggleTheme() {
    const dark = document.body.classList.toggle('dark')
    themeToggle.textContent = dark ? '☀️' : '🌙'
    saveTheme(dark)
}

function showToast(msg) {
    toast.textContent = msg
    toast.classList.add('active')
    clearTimeout(toast._t)
    toast._t = setTimeout(() => toast.classList.remove('active'), 2000)
}

function showLoading(show) {
    loading.classList.toggle('active', show)
}

async function generateEmail() {
    emailDisplay.textContent = 'Generating...'
    copyBtn.disabled = true
    showLoading(true)
    try {
        const data = await fetchApi('action=genRandomMailbox&count=1')
        storedAddress = data[0]
        messages = []
        saveState()
        emailDisplay.innerHTML = storedAddress
        copyBtn.disabled = false
        renderInbox()
        startAutoRefresh()
        navigator.clipboard.writeText(storedAddress).catch(() => {})
        showToast('📋 Copied to clipboard!')
    } catch (err) {
        showToast('Failed. Try again.')
        emailDisplay.innerHTML = '<span class="placeholder">Click to generate</span>'
    } finally {
        showLoading(false)
    }
}

function startAutoRefresh() {
    if (autoTimer) clearInterval(autoTimer)
    autoTimer = setInterval(fetchInbox, 8000)
}

async function fetchInbox() {
    if (!storedAddress) return
    try {
        const at = storedAddress.indexOf('@')
        const data = await fetchApi(`action=getMessages&login=${storedAddress.slice(0, at)}&domain=${storedAddress.slice(at + 1)}`)
        if (!Array.isArray(data)) return
        const existingIds = new Set(messages.map(m => m.id))
        let added = 0
        for (const m of data) {
            if (!existingIds.has(m.id)) { messages.push(m); added++ }
        }
        if (added || !messages.length) {
            messages.sort((a, b) => new Date(b.date) - new Date(a.date))
            saveState()
            renderInbox()
        }
    } catch (err) {}
}

async function fetchAndShow() {
    await fetchInbox()
}

async function openEmail(id) {
    if (!storedAddress) return
    showLoading(true)
    try {
        const at = storedAddress.indexOf('@')
        const msg = await fetchApi(`action=readMessage&login=${storedAddress.slice(0, at)}&domain=${storedAddress.slice(at + 1)}&id=${id}`)
        emailSubject.textContent = msg.subject || '(No Subject)'
        emailFrom.textContent = msg.from || 'Unknown'
        emailDate.textContent = msg.date || ''
        emailBody.innerHTML = msg.htmlBody || msg.textBody?.replace(/\n/g, '<br>') || '<i>(No content)</i>'
        emailModal.classList.add('active')
    } catch (err) {
        showToast('Failed to load')
    } finally {
        showLoading(false)
    }
}

function closeEmail() { emailModal.classList.remove('active') }

function copyOtp(id) {
    const msg = messages.find(m => m.id === id)
    if (!msg) return
    const text = `${msg.subject || ''} ${msg.from || ''}`
    const match = text.match(/\b(\d{4,8})\b/)
    if (match) navigator.clipboard.writeText(match[1]).then(() => showToast('📋 OTP copied!')).catch(() => {})
}

function extractOtp(msg) {
    const text = `${msg.subject || ''} ${msg.from || ''}`
    const match = text.match(/\b(\d{4,8})\b/)
    return match ? match[1] : null
}

function getPreview(msg) {
    const s = (msg.subject || '') + ' — ' + (msg.from || '')
    return s.length > 70 ? s.slice(0, 67) + '...' : s
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
                <p>Waiting for messages...</p>
                <span>Send an email to your temp address</span>
            </div>
        `
        mailCount.textContent = '0'
        return
    }
    mailCount.textContent = messages.length
    messages.forEach((msg, i) => {
        const otp = extractOtp(msg)
        const item = document.createElement('div')
        item.className = 'mail-item unread'
        item.innerHTML = `
            ${otp ? `<span class="otp-badge" data-id="${msg.id}">${esc(otp)}</span>` : `<span class="mail-index">${i + 1}</span>`}
            <div class="mail-content">
                <div class="mail-sender">${esc(msg.from)}</div>
                <div class="mail-subject">${esc(msg.subject)}</div>
                <div class="mail-preview">${esc(getPreview(msg))}</div>
            </div>
            <span class="mail-time">${timeAgo(msg.date)}</span>
        `
        const badge = item.querySelector('.otp-badge')
        if (badge) {
            badge.addEventListener('click', e => { e.stopPropagation(); copyOtp(msg.id) })
        }
        item.addEventListener('click', () => openEmail(msg.id))
        inboxList.appendChild(item)
    })
}

function timeAgo(d) {
    if (!d) return ''
    const diff = Math.floor((Date.now() - new Date(d.replace(' ', 'T'))) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return new Date(d).toLocaleDateString()
}

function esc(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML }

generateBtn.addEventListener('click', generateEmail)

copyBtn.addEventListener('click', () => {
    const e = emailDisplay.textContent
    if (e?.includes('@')) navigator.clipboard.writeText(e).catch(() => {})
})

document.getElementById('refreshBtn')?.addEventListener('click', () => fetchInbox())
checkMailBtn.addEventListener('click', () => fetchInbox())
themeToggle.addEventListener('click', toggleTheme)
backBtn.addEventListener('click', closeEmail)
deleteBtn.addEventListener('click', closeEmail)
emailModal.addEventListener('click', e => { if (e.target === emailModal) closeEmail() })

if (loadTheme()) { document.body.classList.add('dark'); themeToggle.textContent = '☀️' }

if (loadState()) {
    emailDisplay.innerHTML = storedAddress
    copyBtn.disabled = false
    renderInbox()
    startAutoRefresh()
} else {
    generateEmail()
}
