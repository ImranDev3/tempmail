const API = '/api/proxy'
const STORAGE_KEY = 'tempmailpro'

let messages = []
let storedAddress = ''

const emailDisplay = document.getElementById('emailDisplay')
const generateBtn = document.getElementById('generateBtn')
const copyBtn = document.getElementById('copyBtn')
const refreshBtn = document.getElementById('refreshBtn')
const checkMailBtn = document.getElementById('checkMailBtn')
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

async function fetchApi(params) {
    const res = await fetch(`${API}?${params}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}

function showLoading(show) {
    loading.classList.toggle('active', show)
}

function showToast(msg) {
    toast.textContent = msg
    toast.classList.add('active')
    setTimeout(() => toast.classList.remove('active'), 2500)
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
        showToast('Email generated!')
    } catch (err) {
        showToast('Failed. Try again.')
        emailDisplay.innerHTML = '<span class="placeholder">Click to generate</span>'
    } finally {
        showLoading(false)
    }
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
                <div class="mail-sender">${esc(msg.from)}</div>
                <div class="mail-subject">${esc(msg.subject)}</div>
            </div>
            <span class="mail-time">${timeAgo(msg.date)}</span>
        `
        item.addEventListener('click', () => openEmail(msg.id))
        inboxList.appendChild(item)
    })
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
        showToast('Failed')
    } finally {
        showLoading(false)
    }
}

function closeEmail() { emailModal.classList.remove('active') }

function timeAgo(d) {
    if (!d) return ''
    const diff = Math.floor((Date.now() - new Date(d.replace(' ', 'T'))) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(d).toLocaleDateString()
}

function esc(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML }

generateBtn.addEventListener('click', generateEmail)
copyBtn.addEventListener('click', () => {
    const e = emailDisplay.textContent
    if (e?.includes('@')) navigator.clipboard.writeText(e).then(() => showToast('Copied!')).catch(() => {})
})
refreshBtn.addEventListener('click', () => { fetchInbox(); showToast('Checking...') })
checkMailBtn.addEventListener('click', () => { fetchInbox(); showToast('Checking...') })
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
