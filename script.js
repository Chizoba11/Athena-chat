// ========== MULTI-USER SHARED MESSAGE BOARD ==========
// UPDATE THIS WITH YOUR APPS SCRIPT URL AFTER DEPLOYING
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwoF9HA8PQDDb1biLu729ZfTYU4HkYLs2n9m8fgdcIEGfBbxsabU6Cyt0qc_ogC2EcF/exec';

// User Management
let userName = localStorage.getItem('shared_msg_user');
if (!userName || userName === 'null') {
    userName = prompt('👋 Welcome! Enter your name to join the chat:', 'Guest_' + Math.floor(Math.random() * 1000));
    if (userName && userName.trim()) {
        localStorage.setItem('shared_msg_user', userName.trim());
    } else {
        userName = 'Anonymous';
    }
}

// DOM Elements
const postBtn = document.getElementById("postBtn");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const refreshBtn = document.getElementById("refreshBtn");
const changeUserBtn = document.getElementById("changeUserBtn");
const onlineCountBtn = document.getElementById("onlineCountBtn");
const statusElement = document.getElementById("status");
const loadingIndicator = document.getElementById("loadingIndicator"); // ✅ FIXED: Added this

// ========== UPDATE USERNAME DISPLAY ==========
function updateUserDisplay() {
    const header = document.querySelector('.header h1');
    if (header) {
        header.innerHTML = `💬 Shared Message Board <span style="font-size:0.7rem; display:block;">👤 ${escapeHtml(userName)}</span>`;
    }
}
updateUserDisplay();

// ========== API FUNCTIONS ==========
async function loadMessages() {
    // ✅ FIXED: Better URL check
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbwoF9HA8PQDDb1biLu729ZfTYU4HkYLs2n9m8fgdcIEGfBbxsabU6Cyt0qc_ogC2EcF/exec')) {
        showToast('⚠️ Please configure the Apps Script URL', 'error');
        return;
    }
    
    try {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        const response = await fetch(`${"https://script.google.com/macros/s/AKfycbwoF9HA8PQDDb1biLu729ZfTYU4HkYLs2n9m8fgdcIEGfBbxsabU6Cyt0qc_ogC2EcF/exec"}?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.messages && Array.isArray(data.messages)) {
            displayMessages(data.messages);
            updateStatus(true);
        } else if (data.error) {
            console.error('API Error:', data.error);
            showToast('Error loading messages', 'error');
        } else {
            // No messages yet - that's fine
            displayMessages([]);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        updateStatus(false);
        showToast('Failed to connect to server', 'error');
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

async function saveMessage(messageText) {
    // ✅ FIXED: Better URL check
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbwoF9HA8PQDDb1biLu729ZfTYU4HkYLs2n9m8fgdcIEGfBbxsabU6Cyt0qc_ogC2EcF/exec')) {
        showToast('⚠️ Please configure the Apps Script URL', 'error');
        return false;
    }
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: userName,
                message: messageText.trim(),
                timestamp: new Date().toISOString()
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Message sent! ✨', 'success');
            return true;
        } else {
            console.error('Server error:', data.error);
            showToast(data.error || 'Failed to send message', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error saving message:', error);
        showToast('Failed to send message', 'error');
        return false;
    }
}

// ========== UI FUNCTIONS ==========
function updateStatus(isOnline) {
    if (isOnline) {
        statusElement.innerHTML = '🟢 Connected';
        statusElement.style.background = 'rgba(76, 175, 80, 0.3)';
    } else {
        statusElement.innerHTML = '🔴 Offline';
        statusElement.style.background = 'rgba(244, 67, 54, 0.3)';
    }
}

function formatTime(timestamp) {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (isNaN(date.getTime())) return 'Just now';
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    } catch(e) {
        return 'recently';
    }
}

function displayMessages(messagesData) {
    if (!messages) return;
    messages.innerHTML = '';
    
    if (!messagesData || messagesData.length === 0) {
        return;
    }
    
    // Sort by timestamp (oldest first for chat flow)
    const sorted = [...messagesData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sorted.forEach(msg => {
        const isCurrentUser = msg.user === userName;
        const messageDiv = createMessageElement(msg, isCurrentUser);
        messages.appendChild(messageDiv);
    });
    
    // Auto-scroll to bottom
    messages.scrollTop = messages.scrollHeight;
}

function createMessageElement(msg, isCurrentUser) {
    const div = document.createElement("div");
    div.className = `message ${isCurrentUser ? 'my-message' : 'other-message'}`;
    
    const timeStr = formatTime(msg.timestamp);
    const fullDate = new Date(msg.timestamp).toLocaleString();
    
    div.innerHTML = `
        <div class="message-content">
            <strong>${escapeHtml(msg.user)}</strong>
            <span class="message-time" title="${fullDate}">${timeStr}</span>
            <div class="message-text">${escapeHtml(msg.message)}</div>
        </div>
    `;
    
    return div;
}

// Show online users (simplified version that works without backend)
async function showOnlineUsers() {
    showToast('Online users feature coming soon!', 'info');
}

// Change username
function changeUsername() {
    const newName = prompt('Enter your new name:', userName);
    if (newName && newName.trim() && newName.trim() !== userName) {
        userName = newName.trim();
        localStorage.setItem('shared_msg_user', userName);
        updateUserDisplay();
        showToast(`Name changed to ${userName}`, 'success');
        loadMessages(); // Refresh to show correct message alignment
    }
}

// ========== EVENT HANDLERS ==========
postBtn.addEventListener("click", async () => {
    const text = messageInput.value.trim();
    if (!text) {
        showToast("Please type a message", 'error');
        messageInput.focus();
        return;
    }
    
    const success = await saveMessage(text);
    if (success) {
        messageInput.value = "";
        messageInput.focus();
        setTimeout(() => loadMessages(), 500);
    }
});

refreshBtn.addEventListener("click", () => {
    loadMessages();
    showToast('Refreshing...', 'info');
});

if (changeUserBtn) changeUserBtn.addEventListener("click", changeUsername);
if (onlineCountBtn) onlineCountBtn.addEventListener("click", showOnlineUsers);

// Press Enter to send
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        postBtn.click();
    }
});

// Auto-refresh every 3 seconds
let refreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadMessages();
    }
}, 3000);

// Initial load
loadMessages();

// ========== UTILITIES ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#667eea'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 0.875rem;
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 90%;
        text-align: center;
        white-space: nowrap;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// Add style for modal and animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);
