const API = '/api/proxy'
const DIRECT_API = 'https://www.1secmail.com/api/v1'
const STORAGE_KEY = 'tempmailpro'
let useDirectApi = false

let messages = []
let storedAddress = ''
let autoTimer = null
let hasNew = false
let wasEmpty = true
let soundEnabled = localStorage.getItem('tempmail_sound') !== 'off'
let activeViewerId = null

const emailDisplay = document.getElementById('emailDisplay')
const copyBtn = document.getElementById('copyBtn')
const mailCount = document.getElementById('mailCount')
const generateBtn = document.getElementById('generateBtn')
const checkMailBtn = document.getElementById('checkMailBtn')
const clearAllBtn = document.getElementById('clearAllBtn')
const newBadge = document.getElementById('newBadge')
const inboxList = document.getElementById('inboxList')
const themeToggle = document.getElementById('themeToggle')
const viewer = document.getElementById('emailViewer')
const viewerSubject = document.getElementById('viewerSubject')
const viewerFrom = document.getElementById('viewerFrom')
const viewerDate = document.getElementById('viewerDate')
const viewerBody = document.getElementById('viewerBody')
const viewerBack = document.getElementById('viewerBack')
const viewerDelete = document.getElementById('viewerDelete')
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

function saveTheme(dark) { localStorage.setItem('tempmail_theme', dark ? 'dark' : 'light') }
function loadTheme() {
    const saved = localStorage.getItem('tempmail_theme')
    if (saved === null) return true
    return saved === 'dark'
}

async function fetchApi(params) {
    if (useDirectApi) {
        const r = await fetch(`${DIRECT_API}?${params}`)
        if (!r.ok) throw new Error(await r.text())
        return r.json()
    }
    try {
        const r = await fetch(`${API}?${params}`)
        if (!r.ok) throw new Error(await r.text())
        return r.json()
    } catch (e) {
        const r = await fetch(`${DIRECT_API}?${params}`)
        if (!r.ok) throw new Error(await r.text())
        useDirectApi = true
        return r.json()
    }
}

function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark')
    document.body.classList.toggle('dark', dark)
    themeToggle.textContent = dark ? '☀️' : '🌙'
    saveTheme(dark)
}

function showToast(msg) {
    toast.textContent = msg; toast.classList.add('active')
    clearTimeout(toast._t)
    toast._t = setTimeout(() => toast.classList.remove('active'), 2000)
}

function showLoading(s) { loading.classList.toggle('active', s) }

function playSound() {
    if (!soundEnabled) return
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = 880; o.type = 'sine'
        g.gain.setValueAtTime(0.3, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3)
    } catch (e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled
    localStorage.setItem('tempmail_sound', soundEnabled ? 'on' : 'off')
    showToast(soundEnabled ? 'Sound on' : 'Sound off')
}

async function generateEmail() {
    emailDisplay.textContent = 'Generating...'
    showLoading(true)
    wasEmpty = true; hasNew = false
    newBadge.style.display = 'none'
    closeViewer()
    try {
        const data = await fetchApi('action=genRandomMailbox&count=1')
        storedAddress = data[0]
        messages = []
        saveState()
        emailDisplay.innerHTML = storedAddress
        mailCount.textContent = '0'
        renderInbox()
        startAutoRefresh()
        navigator.clipboard.writeText(storedAddress).catch(() => {})
        playSound()
    } catch (err) {
        emailDisplay.innerHTML = '<span class="placeholder">Click to generate</span>'
        showToast(err.message || 'Generate failed. Check connection.')
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
        if (added) {
            messages.sort((a, b) => new Date(b.date) - new Date(a.date))
            saveState()
            hasNew = true; wasEmpty = false
            newBadge.style.display = 'inline'
            playSound()
            mailCount.textContent = messages.length
            renderInbox()
        } else if (!messages.length) {
            renderInbox()
        }
    } catch (err) {}
}

async function fetchAndRefresh() {
    newBadge.style.display = 'none'
    hasNew = false
    showLoading(true)
    await fetchInbox()
    showLoading(false)
}

function deleteMessage(id) {
    messages = messages.filter(m => m.id !== id)
    saveState()
    mailCount.textContent = messages.length
    if (activeViewerId === id) closeViewer()
    renderInbox()
    showToast('Message deleted')
}

function clearAllMessages() {
    if (!messages.length) return
    messages = []
    saveState()
    mailCount.textContent = '0'
    closeViewer()
    renderInbox()
    showToast('All messages cleared')
}

function openEmail(id) {
    if (!storedAddress) return
    activeViewerId = id
    showLoading(true)
    const msg = messages.find(m => m.id === id)
    if (msg?.body) {
        showEmail(msg)
        showLoading(false)
        return
    }
    const at = storedAddress.indexOf('@')
    fetchApi(`action=readMessage&login=${storedAddress.slice(0, at)}&domain=${storedAddress.slice(at + 1)}&id=${id}`)
        .then(data => {
            const m = messages.find(m => m.id === id)
            if (m) {
                m.htmlBody = data.htmlBody
                m.textBody = data.textBody
                m.body = true
            }
            showEmail(data)
        })
        .catch(() => showToast('Failed to load email'))
        .finally(() => showLoading(false))
}

function showEmail(msg) {
    const data = msg.body?.htmlBody ? msg.body : msg
    viewerSubject.textContent = data.subject || '(No Subject)'
    viewerFrom.textContent = data.from || 'Unknown'
    viewerDate.textContent = data.date || ''
    viewerBody.innerHTML = data.htmlBody || data.textBody?.replace(/\n/g, '<br>') || '<i>(No content)</i>'
    viewer.style.display = 'block'
    inboxList.style.display = 'none'
    setTimeout(() => viewer.classList.add('open'), 10)
}

function closeViewer() {
    activeViewerId = null
    viewer.classList.remove('open')
    setTimeout(() => { viewer.style.display = 'none'; inboxList.style.display = 'block' }, 250)
}

function deleteFromViewer() {
    if (activeViewerId) deleteMessage(activeViewerId)
}

function extractOtp(msg) {
    const text = `${msg.subject || ''} ${msg.from || ''}`
    let match = text.match(/\b(\d{4,8})\b/)
    if (match) return match[1]
    const body = msg.htmlBody || msg.textBody || ''
    const clean = body.replace(/<[^>]*>/g, '')
    match = clean.match(/\b(\d{4,8})\b/)
    return match ? match[1] : null
}

function copyOtp(id) {
    const msg = messages.find(m => m.id === id)
    if (!msg) return
    const otp = extractOtp(msg)
    if (otp) navigator.clipboard.writeText(otp).then(() => showToast('OTP copied!')).catch(() => {})
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
        item.className = 'mail-item' + (i === 0 && hasNew ? ' new' : '')
        item.innerHTML = `
            ${otp ? `<span class="otp-badge" data-id="${msg.id}">${esc(otp)}</span>` : `<span class="mail-index">${i + 1}</span>`}
            <div class="mail-content">
                <div class="mail-sender">${esc(msg.from)}</div>
                <div class="mail-subject">${esc(msg.subject)}</div>
            </div>
            <span class="mail-time">${timeAgo(msg.date)}</span>
            <button class="mail-item-delete" data-id="${msg.id}" aria-label="Delete message">✕</button>
        `
        const badge = item.querySelector('.otp-badge')
        if (badge) badge.addEventListener('click', e => { e.stopPropagation(); copyOtp(msg.id) })
        item.querySelector('.mail-item-delete').addEventListener('click', e => { e.stopPropagation(); deleteMessage(msg.id) })
        item.addEventListener('click', () => openEmail(msg.id))
        inboxList.appendChild(item)
    })
}

function timeAgo(d) {
    if (!d) return ''
    const diff = Math.floor((Date.now() - new Date(d.replace(' ', 'T'))) / 1000)
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return new Date(d).toLocaleDateString()
}

function esc(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML }

function copyEmail() {
    const e = emailDisplay.textContent
    if (!e?.includes('@')) return
    navigator.clipboard.writeText(e).catch(() => {})
    emailDisplay.classList.add('copied')
    copyBtn.classList.add('done')
    copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`
    setTimeout(() => {
        emailDisplay.classList.remove('copied')
        copyBtn.classList.remove('done')
        copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
    }, 1200)
}

generateBtn.addEventListener('click', generateEmail)
checkMailBtn.addEventListener('click', fetchAndRefresh)
clearAllBtn.addEventListener('click', clearAllMessages)
copyBtn.addEventListener('click', copyEmail)
emailDisplay.addEventListener('click', copyEmail)
themeToggle.addEventListener('click', toggleTheme)
viewerBack.addEventListener('click', closeViewer)
viewerDelete.addEventListener('click', deleteFromViewer)
document.addEventListener('click', e => { if (e.target === viewer) closeViewer() })
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeViewer() })

document.addEventListener('dblclick', e => {
    if (e.target.closest('.mail-item') && e.target.closest('.otp-badge')) return
    const mailItem = e.target.closest('.mail-item')
    if (mailItem) {
        const idx = Array.from(inboxList.children).indexOf(mailItem)
        const msg = messages[idx]
        if (msg) deleteMessage(msg.id)
    }
})

if (loadTheme()) {
    document.body.classList.add('dark')
    themeToggle.textContent = '☀️'
} else {
    document.documentElement.classList.remove('dark')
    themeToggle.textContent = '🌙'
}

if (loadState()) {
    emailDisplay.innerHTML = storedAddress
    mailCount.textContent = messages.length
    renderInbox()
    startAutoRefresh()
} else {
    generateEmail()
}
