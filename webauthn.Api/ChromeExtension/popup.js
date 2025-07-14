let selectedUser = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCredentials();
    
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
});

async function handleRegister() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        showStatus('Lütfen kullanıcı adı girin!', 'error');
        return;
    }
    
    try {
        showStatus('Kayıt işlemi başlatılıyor...', 'info');
        
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('webauthn')) {
            showStatus('Lütfen webauthn.me sitesine gidin!', 'error');
            return;
        }
        
        // Send registration message to content script
        await chrome.tabs.sendMessage(tab.id, {
            type: 'REGISTER_USER',
            username: username
        });
        
        showStatus('Kayıt işlemi content script\'e gönderildi!', 'success');
        
        // Clear username field
        document.getElementById('username').value = '';
        
        // Reload credentials after a delay
        setTimeout(() => {
            loadCredentials();
        }, 5000); // Increased from 2000 to 5000ms
        
    } catch (error) {
        showStatus('Hata: ' + error.message, 'error');
    }
}

async function handleLogin() {
    if (!selectedUser) {
        showStatus('Lütfen bir kullanıcı seçin!', 'error');
        return;
    }
    
    try {
        showStatus('Giriş işlemi başlatılıyor...', 'info');
        
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('webauthn')) {
            showStatus('Lütfen webauthn.me sitesine gidin!', 'error');
            return;
        }
        
        // Send login message to content script
        await chrome.tabs.sendMessage(tab.id, {
            type: 'LOGIN_USER',
            username: selectedUser
        });
        
        showStatus('Giriş işlemi content script\'e gönderildi!', 'success');
        
    } catch (error) {
        showStatus('Hata: ' + error.message, 'error');
    }
}

function loadCredentials() {
    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        console.error('Chrome storage is not available in popup');
        showStatus('Depolama erişimi yok', 'error');
        return;
    }
    
    chrome.storage.local.get(['credentials'], function(result) {
        const credentials = result.credentials || {};
        const credentialsList = document.getElementById('credentialsList');
        const loginBtn = document.getElementById('loginBtn');
        
        if (Object.keys(credentials).length === 0) {
            credentialsList.innerHTML = '<div class="no-credentials">Henüz kayıtlı kullanıcı yok</div>';
            loginBtn.style.display = 'none';
            selectedUser = null;
            return;
        }
        
        let html = '';
        for (const [username, credential] of Object.entries(credentials)) {
            html += `
                <div class="user-item" data-username="${username}">
                    <div class="user-name">${credential.displayName || username}</div>
                    <div class="user-actions">
                        <button class="use-btn" onclick="selectUser('${username}')">Seç</button>
                        <button class="delete-btn" onclick="deleteCredential('${username}')">Sil</button>
                    </div>
                </div>
            `;
        }
        
        credentialsList.innerHTML = html;
        loginBtn.style.display = 'block';
        
        // Select first user by default if none selected
        if (!selectedUser && Object.keys(credentials).length > 0) {
            selectUser(Object.keys(credentials)[0]);
        }
    });
}

function selectUser(username) {
    selectedUser = username;
    
    // Update UI
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.querySelector(`[data-username="${username}"]`).classList.add('selected');
    
    showStatus(`${username} kullanıcısı seçildi`, 'success');
}

function deleteCredential(username) {
    if (confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz?`)) {
        // Check if chrome.storage is available
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            console.error('Chrome storage is not available for deletion');
            showStatus('Depolama erişimi yok', 'error');
            return;
        }
        
        chrome.storage.local.get(['credentials'], function(result) {
            const credentials = result.credentials || {};
            delete credentials[username];
            
            chrome.storage.local.set({ credentials }, function() {
                if (selectedUser === username) {
                    selectedUser = null;
                }
                loadCredentials();
                showStatus(`${username} kullanıcısı silindi`, 'success');
            });
        });
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

// Global functions for onclick handlers
window.selectUser = selectUser;
window.deleteCredential = deleteCredential; 