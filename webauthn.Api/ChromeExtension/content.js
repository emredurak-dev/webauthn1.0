(function() {
    'use strict';
    
    console.log('WebAuthn Helper: IMMEDIATE execution starting...');
    
    // Aggressive

    console.log('WebAuthn Helper: Starting ultra aggressive WebAuthn protection...');

    // IMMEDIATELY store and REMOVE all WebAuthn-related APIs before page can use them
    const STORED_WEBAUTHN = {
        credentials: navigator.credentials,
        PublicKeyCredential: window.PublicKeyCredential,
        originalCreate: navigator.credentials ? navigator.credentials.create : null,
        originalGet: navigator.credentials ? navigator.credentials.get : null
    };

    // ALSO STOP ALL SCRIPT EXECUTION by overriding setTimeout/setInterval
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalAddEventListener = window.addEventListener;
    const originalDocumentAddEventListener = document.addEventListener;
    const originalConsoleLog = console.log;
    
    let scriptsBlocked = true;
    
    // Block all timers and animation frames to prevent page scripts from running
    window.setTimeout = function(callback, delay, ...args) {
        if (scriptsBlocked) {
            const callbackStr = callback.toString();
            
            // WHITELIST: Allow our own extension operations
            if (callbackStr.includes('WebAuthn Helper:') || 
                callbackStr.includes('Starting pending action execution') ||
                callbackStr.includes('handleWebAuthnRegister') ||
                callbackStr.includes('handleWebAuthnAuthenticate') ||
                callbackStr.includes('action.action')) {
                // This is our extension's own setTimeout, allow it
                return originalSetTimeout.call(this, callback, delay, ...args);
            }
            
            if (callbackStr.includes('webauthn') || 
                callbackStr.includes('credential') || 
                callbackStr.includes('PublicKey') ||
                callbackStr.includes('conditional') ||
                callbackStr.includes('AUTHENTICATION') ||
                callbackStr.includes('Setting up') ||
                callbackStr.includes('Conditional UI')) {
                console.log('WebAuthn Helper: BLOCKED WebAuthn-related setTimeout');
                return -1;
            }
        }
        return originalSetTimeout.call(this, callback, delay, ...args);
    };
    
    window.setInterval = function(callback, delay, ...args) {
        if (scriptsBlocked) {
            const callbackStr = callback.toString();
            if (callbackStr.includes('webauthn') || 
                callbackStr.includes('credential') || 
                callbackStr.includes('PublicKey') ||
                callbackStr.includes('conditional') ||
                callbackStr.includes('Setting up')) {
                console.log('WebAuthn Helper: BLOCKED WebAuthn-related setInterval');
                return -1;
            }
        }
        return originalSetInterval.call(this, callback, delay, ...args);
    };
    
    window.requestAnimationFrame = function(callback) {
        if (scriptsBlocked) {
            const callbackStr = callback.toString();
            if (callbackStr.includes('webauthn') || 
                callbackStr.includes('credential') || 
                callbackStr.includes('PublicKey') ||
                callbackStr.includes('conditional')) {
                console.log('WebAuthn Helper: BLOCKED WebAuthn-related requestAnimationFrame');
                return -1;
            }
        }
        return originalRequestAnimationFrame.call(this, callback);
    };

    // Also block event listeners that might set up WebAuthn
    window.addEventListener = function(type, listener, options) {
        if (scriptsBlocked && typeof listener === 'function') {
            const listenerStr = listener.toString();
            if (listenerStr.includes('webauthn') || 
                listenerStr.includes('credential') || 
                listenerStr.includes('PublicKey') ||
                listenerStr.includes('conditional')) {
                console.log('WebAuthn Helper: BLOCKED WebAuthn-related addEventListener');
                return;
            }
        }
        return originalAddEventListener.call(this, type, listener, options);
    };

    document.addEventListener = function(type, listener, options) {
        if (scriptsBlocked && typeof listener === 'function') {
            const listenerStr = listener.toString();
            if (listenerStr.includes('webauthn') || 
                listenerStr.includes('credential') || 
                listenerStr.includes('PublicKey') ||
                listenerStr.includes('conditional')) {
                console.log('WebAuthn Helper: BLOCKED WebAuthn-related document.addEventListener');
                return;
            }
        }
        return originalDocumentAddEventListener.call(this, type, listener, options);
    };

    // Also block console.log that might be used by WebAuthn setup
    console.log = function(...args) {
        if (scriptsBlocked && args.length > 0) {
            const messageStr = args[0] ? args[0].toString() : '';
            
            // WHITELIST: Allow our own extension logs
            if (messageStr.includes('WebAuthn Helper:')) {
                return originalConsoleLog.apply(this, args);
            }
            
            if (messageStr.includes('AUTHENTICATION OPTIONS') || 
                messageStr.includes('Setting up Conditional UI') ||
                messageStr.includes('webauthn') ||
                messageStr.includes('credential') ||
                messageStr.includes('PublicKey')) {
                originalConsoleLog.call(this, 'WebAuthn Helper: BLOCKED WebAuthn-related console.log');
                return;
            }
        }
        return originalConsoleLog.apply(this, args);
    };

    // Track if we've applied blocking
    let blockingApplied = false;

    // Function to apply blocking
    function applyWebAuthnBlocking() {
        if (blockingApplied) return;
        
        // COMPLETELY DELETE WebAuthn from the browser
        try { delete navigator.credentials; } catch(e) {}
        try { delete window.PublicKeyCredential; } catch(e) {}
        try { delete window.navigator.credentials; } catch(e) {}

        // Override any attempt to access these
        try {
            Object.defineProperty(navigator, 'credentials', {
                get: function() {
                    console.log('WebAuthn Helper: BLOCKED attempt to access navigator.credentials');
                    return undefined;
                },
                set: function() {
                    console.log('WebAuthn Helper: BLOCKED attempt to set navigator.credentials');
                },
                configurable: true // Make it configurable so we can remove it later
            });
        } catch(e) {
            console.log('WebAuthn Helper: Could not redefine navigator.credentials, trying different approach');
            navigator.credentials = undefined;
        }

        try {
            Object.defineProperty(window, 'PublicKeyCredential', {
                get: function() {
                    console.log('WebAuthn Helper: BLOCKED attempt to access PublicKeyCredential');
                    return undefined;
                },
                set: function() {
                    console.log('WebAuthn Helper: BLOCKED attempt to set PublicKeyCredential');
                },
                configurable: true // Make it configurable so we can remove it later
            });
        } catch(e) {
            console.log('WebAuthn Helper: Could not redefine PublicKeyCredential, trying different approach');
            window.PublicKeyCredential = undefined;
        }

        // Also block navigator access through window.navigator
        try {
            Object.defineProperty(window.navigator, 'credentials', {
                get: function() {
                    console.log('WebAuthn Helper: BLOCKED attempt to access window.navigator.credentials');
                    return undefined;
                },
                set: function() {
                    console.log('WebAuthn Helper: BLOCKED attempt to set window.navigator.credentials');
                },
                configurable: true // Make it configurable so we can remove it later
            });
        } catch(e) {
            console.log('WebAuthn Helper: Could not redefine window.navigator.credentials, trying different approach');
            if (window.navigator) {
                window.navigator.credentials = undefined;
            }
        }
        
        blockingApplied = true;
        console.log('WebAuthn Helper: WebAuthn APIs completely blocked');
    }

    // Function to remove blocking
    function removeWebAuthnBlocking() {
        if (!blockingApplied) return;
        
        try {
            delete navigator.credentials;
        } catch(e) {
            console.log('WebAuthn Helper: Could not delete navigator.credentials property');
        }
        
        try {
            delete window.PublicKeyCredential;
        } catch(e) {
            console.log('WebAuthn Helper: Could not delete PublicKeyCredential property');
        }
        
        try {
            delete window.navigator.credentials;
        } catch(e) {
            console.log('WebAuthn Helper: Could not delete window.navigator.credentials property');
        }
        
        blockingApplied = false;
        console.log('WebAuthn Helper: WebAuthn blocking removed');
    }

    // Apply initial blocking
    applyWebAuthnBlocking();

    // Function to temporarily restore WebAuthn for our use
    function enableWebAuthnForExtension() {
        console.log('WebAuthn Helper: Temporarily restoring WebAuthn for extension...');
        
        // First remove the blocking
        removeWebAuthnBlocking();
        
        // Allow scripts to run normally for our operation
        scriptsBlocked = false;
        
        // Now restore the APIs
        try {
            Object.defineProperty(navigator, 'credentials', {
                value: STORED_WEBAUTHN.credentials,
                writable: true,
                configurable: true
            });
        } catch(e) {
            navigator.credentials = STORED_WEBAUTHN.credentials;
        }
        
        try {
            Object.defineProperty(window, 'PublicKeyCredential', {
                value: STORED_WEBAUTHN.PublicKeyCredential,
                writable: true,
                configurable: true
            });
        } catch(e) {
            window.PublicKeyCredential = STORED_WEBAUTHN.PublicKeyCredential;
        }
        
        try {
            Object.defineProperty(window.navigator, 'credentials', {
                value: STORED_WEBAUTHN.credentials,
                writable: true,
                configurable: true
            });
        } catch(e) {
            if (window.navigator) {
                window.navigator.credentials = STORED_WEBAUTHN.credentials;
            }
        }
        
        console.log('WebAuthn Helper: WebAuthn APIs restored temporarily');
    }

    // Function to remove WebAuthn again after our use
    function disableWebAuthnAfterUse() {
        console.log('WebAuthn Helper: Removing WebAuthn APIs again...');
        
        // Block scripts again
        scriptsBlocked = true;
        
        // Re-apply blocking
        applyWebAuthnBlocking();
        
        console.log('WebAuthn Helper: WebAuthn APIs blocked again');
    }

    // Make functions available globally
    window.enableWebAuthnForExtension = enableWebAuthnForExtension;
    window.disableWebAuthnAfterUse = disableWebAuthnAfterUse;

    // MAIN CONTENT SCRIPT

    console.log('WebAuthn Helper content script loaded on:', window.location.href);

    // Function to show confirmation dialog
    function showConfirmationDialog(type, username) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            const title = type === 'register' ? 'WebAuthn Kaydı' : 'WebAuthn Girişi';
            const message = type === 'register' 
                ? `"${username}" kullanıcısı için WebAuthn anahtarı oluşturulsun mu?`
                : `"${username}" kullanıcısı ile WebAuthn kimlik doğrulaması yapılsın mı?`;

            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; color: #1a73e8;">🔐 ${title}</h3>
                <p style="margin: 0 0 20px 0; color: #5f6368;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="webauthn-yes" style="
                        background: #1a73e8;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Evet</button>
                    <button id="webauthn-no" style="
                        background: #f8f9fa;
                        color: #3c4043;
                        border: 1px solid #dadce0;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Hayır</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            document.getElementById('webauthn-yes').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(true);
            });

            document.getElementById('webauthn-no').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            });
        });
    }

    // Function to get username from the page
    function getUsernameFromPage() {
        const usernameInput = document.querySelector('#username') || 
                             document.querySelector('input[name="username"]') ||
                             document.querySelector('input[placeholder*="username" i]') ||
                             document.querySelector('input[type="text"]');
        
        if (usernameInput && usernameInput.value) {
            return usernameInput.value;
        }
        
        return 'emre';
    }

    // Function to handle WebAuthn registration
    async function handleWebAuthnRegister(username) {
        // Prevent infinite loops and ensure cleanup
        if (window.webauthnRegistrationInProgress) {
            console.log('WebAuthn Helper: Registration already in progress, skipping...');
            showNotification('Kayıt işlemi devam ediyor, lütfen bekleyin...', 'info');
            return;
        }

        window.webauthnRegistrationInProgress = true;
        let siteRegisterButton = null;

        try {
            // Force cleanup before starting new operation
            await window.forceCleanupWebAuthnState();

            console.log('Starting WebAuthn registration for:', username);
            showNotification('WebAuthn kaydı başlatılıyor...', 'info');
            
            // First, let's try to trigger the site's own registration process
            console.log('WebAuthn Helper: First triggering site\'s own registration...');
            
            // Find the site's actual register button
            console.log('WebAuthn Helper: Looking for site register buttons...');
            
            // Let's debug what buttons exist on the page
            const allButtons = document.querySelectorAll('button');
            console.log('WebAuthn Helper: All buttons on page:', Array.from(allButtons).map(b => ({
                id: b.id,
                className: b.className,
                text: b.textContent,
                onclick: b.onclick ? 'has onclick' : 'no onclick'
            })));
            
            // More comprehensive search for register button
            siteRegisterButton = document.querySelector('#register') || 
                                      document.querySelector('button[onclick*="register"]') ||
                                      document.querySelector('button[onclick*="Register"]') ||
                                      document.querySelector('.register') ||
                                      document.querySelector('button[id*="register"]') ||
                                      document.querySelector('button[class*="register"]') ||
                                      Array.from(allButtons).find(btn => 
                                        btn.textContent.toLowerCase().includes('register') ||
                                        btn.id.toLowerCase().includes('register') ||
                                        btn.className.toLowerCase().includes('register')
                                      );
            
            console.log('WebAuthn Helper: Found site register button:', siteRegisterButton);
            
            if (siteRegisterButton && siteRegisterButton !== event?.target) {
                // Set up WebAuthn interception for registration
                console.log('WebAuthn Helper: Setting up WebAuthn interception for site calls...');
                
                // Temporarily enable WebAuthn for the site's call
                window.enableWebAuthnForExtension();
                
                // Override the WebAuthn create function to intercept and save to storage
                const originalCreate = navigator.credentials.create;
                let siteCallCompleted = false;
                
                navigator.credentials.create = async function(options) {
                    console.log('WebAuthn Helper: Intercepted site\'s WebAuthn call with options:', options);
                    
                    try {
                        // Let the site's call proceed normally
                        const result = await originalCreate.call(this, options);
                        console.log('WebAuthn Helper: Site\'s WebAuthn call completed:', result);
                        siteCallCompleted = true;
                        
                        // Save to storage immediately after site's successful call
                        console.log('WebAuthn Helper: Saving site result to storage...');
                        saveUserToStorage(username, result.id || result.rawId || username);
                        
                        // Also do our backend registration AFTER site call completes
                        setTimeout(async () => {
                            try {
                                console.log('WebAuthn Helper: Starting our backend registration after site call...');
                                // Wait longer to ensure WebAuthn API is completely free
                                await new Promise(resolve => setTimeout(resolve, 3000));
                                
                                // Temporarily restore WebAuthn for our call
                                window.enableWebAuthnForExtension();
                                
                                await performOurRegistration(username);
                                console.log('WebAuthn Helper: Backend registration also completed!');
                                showNotification('Backend kayıt da tamamlandı!', 'success');
                                
                                // Block WebAuthn again after our call
                                window.disableWebAuthnAfterUse();
                            } catch (e) {
                                console.log('WebAuthn Helper: Backend registration failed (not critical):', e);
                                // If backend fails, that's OK since site registration succeeded
                                window.disableWebAuthnAfterUse();
                            } finally {
                                window.webauthnRegistrationInProgress = false;
                            }
                        }, 5000); // Increased delay to 5 seconds
                        
                        return result;
                    } finally {
                        // Restore original function and disable WebAuthn
                        navigator.credentials.create = originalCreate;
                        console.log('WebAuthn Helper: Site call completed, now disabling WebAuthn...');
                        window.disableWebAuthnAfterUse();
                    }
                };
                
                // Don't click anything, just wait for site's normal flow
                console.log('WebAuthn Helper: WebAuthn interception ready. Site can proceed normally.');
                
                // Automatically click the site's register button after a longer delay
                setTimeout(() => {
                    console.log('WebAuthn Helper: Auto-clicking site\'s register button...');
                    showNotification('Site register butonuna otomatik tıklanıyor...', 'info');
                    
                    // Temporarily remove our event listener to prevent loop
                    document.removeEventListener('click', handleDocumentClick, true);
                    
                    // Click the site's button
                    siteRegisterButton.click();
                    
                    // Restore our event listener after site's flow completes
                    setTimeout(() => {
                        document.addEventListener('click', handleDocumentClick, true);
                    }, 10000); // Increased to 10 seconds
                    
                }, 2000); // Increased delay before clicking
                
                // Don't disable WebAuthn yet - wait much longer for site's call to complete
                console.log('WebAuthn Helper: Keeping WebAuthn enabled for site\'s call...');
                
                // Set a longer timeout to disable WebAuthn if no intercept happens
                setTimeout(async () => {
                    if (!siteCallCompleted) {
                        console.log('WebAuthn Helper: No site call intercepted, doing fallback registration...');
                        try {
                            // Wait a bit to ensure no other WebAuthn operations are pending
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Temporarily restore WebAuthn for our call
                            window.enableWebAuthnForExtension();
                            
                            // Do direct registration as fallback
                            await performOurRegistration(username);
                            console.log('WebAuthn Helper: Fallback registration successful!');
                            showNotification('WebAuthn kaydı başarılı! (Backend)', 'success');
                            
                            // Block WebAuthn again after our call
                            window.disableWebAuthnAfterUse();
                        } catch (e) {
                            console.log('WebAuthn Helper: Fallback registration also failed:', e);
                            if (e.message.includes('pending')) {
                                showNotification('WebAuthn işlemi devam ediyor, lütfen bekleyin...', 'info');
                            }
                            window.disableWebAuthnAfterUse();
                        } finally {
                            window.webauthnRegistrationInProgress = false;
                        }
                    } else {
                        console.log('WebAuthn Helper: Site call was successful, skipping fallback');
                    }
                }, 20000); // Increased timeout to 20 seconds
                
                return; // Exit early without disabling WebAuthn
                
            } else {
                // Fallback to our direct registration only
                console.log('WebAuthn Helper: No suitable site button found or clicked by extension, doing direct registration...');
                
                try {
                    // Restore WebAuthn APIs for our use
                    window.enableWebAuthnForExtension();
                    
                    // Wait a bit for any pending operations to settle
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    await performOurRegistration(username);
                    
                    showNotification('WebAuthn kaydı başarılı!', 'success');
                } catch (e) {
                    console.error('WebAuthn Helper: Direct registration failed:', e);
                    showNotification('WebAuthn kaydı başarısız: ' + e.message, 'error');
                } finally {
                    window.disableWebAuthnAfterUse();
                    window.webauthnRegistrationInProgress = false;
                }
            }
        } catch (error) {
            console.error('WebAuthn Helper: Registration process failed:', error);
            showNotification('WebAuthn kaydı başarısız: ' + error.message, 'error');
            window.disableWebAuthnAfterUse();
            window.webauthnRegistrationInProgress = false;
        }
    }
    
    // Function to show user selection popup
    function showUserSelectionPopup() {
        // Check if chrome.storage is available
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            console.error('WebAuthn Helper: chrome.storage.local is not available for user selection');
            showNotification('Depolama erişimi yok. Extension izinlerini kontrol edin.', 'error');
            return;
        }
        
        chrome.storage.local.get(['credentials'], function(result) {
            const credentials = result.credentials || {};
            const usernames = Object.keys(credentials);
            
            if (usernames.length === 0) {
                showNotification('Henüz kayıtlı kullanıcı yok! Önce register edin.', 'error');
                return;
            }
            
            // Create popup HTML
            const popupHtml = `
                <div id="webauthn-user-selection" style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    min-width: 300px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                ">
                    <h3 style="margin: 0 0 15px 0; text-align: center;">Giriş yapmak istediğiniz kullanıcıyı seçin</h3>
                    <div style="margin-bottom: 15px;">
                        ${usernames.map(username => `
                            <div class="user-option" data-username="${username}" style="
                                padding: 10px;
                                margin: 5px 0;
                                background: rgba(255, 255, 255, 0.1);
                                border-radius: 5px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                border: 1px solid rgba(255, 255, 255, 0.2);
                            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                                <strong>${credentials[username].displayName || username}</strong>
                                <div style="font-size: 12px; opacity: 0.8;">
                                    Kayıt: ${new Date(credentials[username].timestamp || Date.now()).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align: center;">
                        <button id="webauthn-cancel-selection" style="
                            background: rgba(244, 67, 54, 0.8);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">İptal</button>
                    </div>
                </div>
                <div id="webauthn-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                "></div>
            `;
            
            // Add popup to page
            const popupContainer = document.createElement('div');
            popupContainer.innerHTML = popupHtml;
            document.body.appendChild(popupContainer);
            
            // Add event listeners
            document.querySelectorAll('.user-option').forEach(option => {
                option.addEventListener('click', function() {
                    const selectedUsername = this.getAttribute('data-username');
                    console.log('User selected for login:', selectedUsername);
                    
                    // Remove popup
                    document.body.removeChild(popupContainer);
                    
                    // Start authentication
                    showNotification(`${selectedUsername} ile giriş yapılıyor...`, 'info');
                    handleWebAuthnAuthenticate(selectedUsername);
                });
            });
            
            // Cancel button
            document.getElementById('webauthn-cancel-selection').addEventListener('click', function() {
                document.body.removeChild(popupContainer);
            });
            
            // Click overlay to close
            document.getElementById('webauthn-overlay').addEventListener('click', function() {
                document.body.removeChild(popupContainer);
            });
        });
    }

    // Helper function to save user to storage
    function saveUserToStorage(username, credentialId) {
        console.log('WebAuthn Helper: Attempting to save to extension storage...', { username, credentialId });
        
        // Check if chrome.storage is available
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            console.error('WebAuthn Helper: chrome.storage.local is not available');
            showNotification('Depolama erişimi yok. Extension izinlerini kontrol edin.', 'error');
            return;
        }
        
        chrome.storage.local.get(['credentials'], function(result) {
            const credentials = result.credentials || {};
            credentials[username] = {
                id: credentialId,
                displayName: username,
                timestamp: Date.now()
            };
            chrome.storage.local.set({ credentials }, function() {
                console.log('WebAuthn Helper: Successfully saved to storage:', username, credentials);
                showNotification('WebAuthn kaydı başarılı! (Hem site hem backend)', 'success');
            });
        });
    }

    // Helper function to perform our registration
    async function performOurRegistration(username) {
        try {
            console.log('WebAuthn Helper: Performing our backend registration...');
            
            // Get registration options from API
            const optionsResponse = await fetch('https://localhost:7072/api/webauthn/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    username: username,
                    origin: window.location.origin
                })
            });

            if (!optionsResponse.ok) {
                const errorText = await optionsResponse.text();
                throw new Error('Registration options alınamadı: ' + errorText);
            }

            const options = await optionsResponse.json();
            console.log('WebAuthn Helper: Our registration options:', options);

            // Store the original options JSON for later use
            const originalOptionsJson = JSON.stringify(options.options);

            // Helper function to convert Base64 URL to ArrayBuffer
            function base64URLToArrayBuffer(base64URL) {
                // Add padding if needed
                const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
                const padding = '='.repeat((4 - base64.length % 4) % 4);
                const base64WithPadding = base64 + padding;
                
                // Convert to binary string
                const binaryString = atob(base64WithPadding);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            }

            // Convert challenge and user ID using proper Base64 URL decoding
            const challengeBuffer = base64URLToArrayBuffer(options.options.challenge);
            const userIdBuffer = base64URLToArrayBuffer(options.options.user.id);

            const publicKeyCredentialCreationOptions = {
                challenge: challengeBuffer,
                rp: options.options.rp,
                user: {
                    id: userIdBuffer,
                    name: options.options.user.name,
                    displayName: options.options.user.displayName
                },
                pubKeyCredParams: options.options.pubKeyCredParams,
                authenticatorSelection: options.options.authenticatorSelection,
                timeout: options.options.timeout,
                attestation: options.options.attestation
            };

            console.log('WebAuthn Helper: Calling our WebAuthn create...');
            
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            console.log('WebAuthn Helper: Our credential created successfully:', credential);

            // Helper function to convert ArrayBuffer to Base64 URL
            function arrayBufferToBase64URL(buffer) {
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            }

            // Send response to API using proper Base64 URL encoding
            const attestationResponse = {
                username: username,
                rawId: arrayBufferToBase64URL(credential.rawId),
                response: {
                    clientDataJSON: arrayBufferToBase64URL(credential.response.clientDataJSON),
                    attestationObject: arrayBufferToBase64URL(credential.response.attestationObject)
                },
                originalOptionsJson: originalOptionsJson
            };

            const completeResponse = await fetch('https://localhost:7072/api/webauthn/register/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(attestationResponse)
            });

            if (!completeResponse.ok) {
                const errorText = await completeResponse.text();
                throw new Error('Registration tamamlanamadı: ' + errorText);
            }

            console.log('WebAuthn Helper: Registration completed successfully!');
            
            // Store in extension storage using helper function
            saveUserToStorage(username, attestationResponse.rawId);

            return credential;

        } catch (error) {
            console.error('WebAuthn Helper: Our registration failed:', error);
            throw error;
        }
    }

    // Function to handle WebAuthn authentication
    async function handleWebAuthnAuthenticate(username) {
        // Prevent infinite loops and ensure cleanup
        if (window.webauthnAuthenticationInProgress) {
            console.log('WebAuthn Helper: Authentication already in progress, skipping...');
            showNotification('Giriş işlemi devam ediyor, lütfen bekleyin...', 'info');
            return;
        }

        window.webauthnAuthenticationInProgress = true;
        let siteLoginButton = null;

        try {
            // Force cleanup before starting new operation
            await window.forceCleanupWebAuthnState();

            console.log('Starting WebAuthn authentication for:', username);
            showNotification('WebAuthn girişi başlatılıyor...', 'info');
            
            // First, let's try to trigger the site's own authentication process
            console.log('WebAuthn Helper: First triggering site\'s own authentication...');
            
            // Find the site's actual login/authenticate button
            console.log('WebAuthn Helper: Looking for site login buttons...');
            
            // Let's debug what buttons exist on the page
            const allButtons = document.querySelectorAll('button');
            console.log('WebAuthn Helper: All buttons on page:', Array.from(allButtons).map(b => ({
                id: b.id,
                className: b.className,
                text: b.textContent,
                onclick: b.onclick ? 'has onclick' : 'no onclick'
            })));
            
            // More comprehensive search for login/authenticate button
            siteLoginButton = document.querySelector('#login') || 
                                   document.querySelector('#authenticate') ||
                                   document.querySelector('button[onclick*="login"]') ||
                                   document.querySelector('button[onclick*="authenticate"]') ||
                                   document.querySelector('button[onclick*="Login"]') ||
                                   document.querySelector('button[onclick*="Authenticate"]') ||
                                   document.querySelector('.login') ||
                                   document.querySelector('.authenticate') ||
                                   document.querySelector('button[id*="login"]') ||
                                   document.querySelector('button[id*="authenticate"]') ||
                                   document.querySelector('button[class*="login"]') ||
                                   document.querySelector('button[class*="authenticate"]') ||
                                   Array.from(allButtons).find(btn => 
                                     btn.textContent.toLowerCase().includes('login') ||
                                     btn.textContent.toLowerCase().includes('authenticate') ||
                                     btn.id.toLowerCase().includes('login') ||
                                     btn.id.toLowerCase().includes('authenticate') ||
                                     btn.className.toLowerCase().includes('login') ||
                                     btn.className.toLowerCase().includes('authenticate')
                                   );
            
            console.log('WebAuthn Helper: Found site login button:', siteLoginButton);
            
            if (siteLoginButton && siteLoginButton !== event?.target) {
                // Set up WebAuthn interception for authentication
                console.log('WebAuthn Helper: Setting up WebAuthn interception for site auth calls...');
                
                // Temporarily enable WebAuthn for the site's call
                window.enableWebAuthnForExtension();
                
                // Override the WebAuthn get function to intercept and parallel process
                const originalGet = navigator.credentials.get;
                let siteCallCompleted = false;
                
                navigator.credentials.get = async function(options) {
                    console.log('WebAuthn Helper: Intercepted site\'s WebAuthn auth call with options:', options);
                    
                    try {
                        // Let the site's call proceed normally FIRST
                        const result = await originalGet.call(this, options);
                        console.log('WebAuthn Helper: Site\'s WebAuthn auth call completed:', result);
                        siteCallCompleted = true;
                        
                        // Do our authentication AFTER site call completes (sequential, not parallel)
                        setTimeout(async () => {
                            try {
                                console.log('WebAuthn Helper: Starting our backend authentication after site call...');
                                // Wait longer to ensure WebAuthn API is completely free
                                await new Promise(resolve => setTimeout(resolve, 3000));
                                
                                // Temporarily restore WebAuthn for our call
                                window.enableWebAuthnForExtension();
                                
                                const ourAssertion = await performOurAuthentication(username);
                                if (ourAssertion) {
                                    console.log('WebAuthn Helper: Our authentication completed successfully');
                                    showNotification('Backend authentication da tamamlandı!', 'success');
                                }
                                
                                // Block WebAuthn again after our call
                                window.disableWebAuthnAfterUse();
                            } catch (e) {
                                console.log('WebAuthn Helper: Our authentication failed (not critical):', e);
                                // If backend fails, that's OK since site auth succeeded
                                window.disableWebAuthnAfterUse();
                            } finally {
                                window.webauthnAuthenticationInProgress = false;
                            }
                        }, 5000); // Increased delay to 5 seconds
                        
                        return result;
                    } finally {
                        // Restore original function and disable WebAuthn
                        navigator.credentials.get = originalGet;
                        console.log('WebAuthn Helper: Site auth call completed, now disabling WebAuthn...');
                        window.disableWebAuthnAfterUse();
                    }
                };
                
                console.log('WebAuthn Helper: WebAuthn auth interception ready. Site can proceed normally.');
                
                // Automatically click the site's login button after a longer delay
                setTimeout(() => {
                    console.log('WebAuthn Helper: Auto-clicking site\'s login button...');
                    showNotification('Site login butonuna otomatik tıklanıyor...', 'info');
                    
                    // Temporarily remove our event listener to prevent loop
                    document.removeEventListener('click', handleDocumentClick, true);
                    
                    // Click the site's button
                    siteLoginButton.click();
                    
                    // Restore our event listener after site's flow completes
                    setTimeout(() => {
                        document.addEventListener('click', handleDocumentClick, true);
                    }, 10000); // Increased to 10 seconds
                    
                }, 2000); // Increased delay before clicking
                
                // Don't disable WebAuthn yet - wait much longer for site's call to complete
                console.log('WebAuthn Helper: Keeping WebAuthn enabled for site\'s auth call...');
                
                // Set a longer timeout to disable WebAuthn if no intercept happens
                setTimeout(async () => {
                    if (!siteCallCompleted) {
                        console.log('WebAuthn Helper: No site auth call intercepted, doing fallback authentication...');
                        try {
                            // Wait a bit to ensure no other WebAuthn operations are pending
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Temporarily restore WebAuthn for our call
                            window.enableWebAuthnForExtension();
                            
                            // Do direct authentication as fallback
                            await performOurAuthentication(username);
                            console.log('WebAuthn Helper: Fallback authentication successful!');
                            showNotification('WebAuthn girişi başarılı! (Backend)', 'success');
                            
                            // Block WebAuthn again after our call
                            window.disableWebAuthnAfterUse();
                        } catch (e) {
                            console.log('WebAuthn Helper: Fallback authentication also failed:', e);
                            if (e.message.includes('pending')) {
                                showNotification('WebAuthn işlemi devam ediyor, lütfen bekleyin...', 'info');
                            }
                            window.disableWebAuthnAfterUse();
                        } finally {
                            window.webauthnAuthenticationInProgress = false;
                        }
                    } else {
                        console.log('WebAuthn Helper: Site auth call was successful, skipping fallback');
                    }
                }, 20000); // Increased timeout to 20 seconds
                
                return; // Exit early without disabling WebAuthn
                
            } else {
                // Fallback to our direct authentication only
                console.log('WebAuthn Helper: No suitable site login button found, doing direct authentication...');
                
                try {
                    // Restore WebAuthn APIs for our use
                    window.enableWebAuthnForExtension();
                    
                    // Wait a bit for any pending operations to settle
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    await performOurAuthentication(username);
                    
                    showNotification('WebAuthn girişi başarılı!', 'success');
                } catch (e) {
                    console.error('WebAuthn Helper: Direct authentication failed:', e);
                    showNotification('WebAuthn girişi başarısız: ' + e.message, 'error');
                } finally {
                    window.disableWebAuthnAfterUse();
                    window.webauthnAuthenticationInProgress = false;
                }
            }
        } catch (error) {
            console.error('WebAuthn Helper: Authentication process failed:', error);
            showNotification('WebAuthn girişi başarısız: ' + error.message, 'error');
            window.disableWebAuthnAfterUse();
            window.webauthnAuthenticationInProgress = false;
        }
    }
    
    // Helper function to perform our authentication
    async function performOurAuthentication(username) {
        try {
            console.log('WebAuthn Helper: Performing our backend authentication...');
            
            // Get authentication options from API
            const optionsResponse = await fetch('https://localhost:7072/api/webauthn/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    username: username,
                    origin: window.location.origin
                })
            });

            if (!optionsResponse.ok) {
                const errorText = await optionsResponse.text();
                throw new Error('Authentication options alınamadı: ' + errorText);
            }

            const options = await optionsResponse.json();
            console.log('WebAuthn Helper: Our authentication options:', options);

            // Store the original options JSON for later use
            const originalOptionsJson = JSON.stringify(options.options);

            // Helper function to convert Base64 URL to ArrayBuffer
            function base64URLToArrayBuffer(base64URL) {
                // Add padding if needed
                const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
                const padding = '='.repeat((4 - base64.length % 4) % 4);
                const base64WithPadding = base64 + padding;
                
                // Convert to binary string
                const binaryString = atob(base64WithPadding);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            }

            // Convert challenge from Base64 URL to ArrayBuffer
            const challengeBuffer = base64URLToArrayBuffer(options.options.challenge);
            
            // Convert allowCredentials IDs to ArrayBuffer
            let allowCredentials = [];
            if (options.options.allowCredentials) {
                allowCredentials = options.options.allowCredentials.map(cred => ({
                    ...cred,
                    id: base64URLToArrayBuffer(cred.id)
                }));
            }

            const publicKeyCredentialRequestOptions = {
                challenge: challengeBuffer,
                allowCredentials: allowCredentials,
                timeout: options.options.timeout,
                userVerification: options.options.userVerification
            };

            console.log('WebAuthn Helper: Calling our WebAuthn get...');
            
            // Temporarily restore WebAuthn for our authentication call
            enableWebAuthnForExtension();
            console.log('WebAuthn Helper: WebAuthn APIs restored for authentication');
            
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            console.log('WebAuthn Helper: Our assertion received successfully:', assertion);
            
            // Block WebAuthn again after our call
            applyWebAuthnBlocking();
            console.log('WebAuthn Helper: WebAuthn APIs blocked again after authentication');

            // Helper function to convert ArrayBuffer to Base64 URL
            function arrayBufferToBase64URL(buffer) {
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            }

            // Send response to API using proper Base64 URL encoding
            const assertionResponse = {
                username: username,
                rawId: arrayBufferToBase64URL(assertion.rawId),
                response: {
                    clientDataJSON: arrayBufferToBase64URL(assertion.response.clientDataJSON),
                    authenticatorData: arrayBufferToBase64URL(assertion.response.authenticatorData),
                    signature: arrayBufferToBase64URL(assertion.response.signature),
                    userHandle: assertion.response.userHandle ? arrayBufferToBase64URL(assertion.response.userHandle) : null
                },
                originalOptionsJson: originalOptionsJson
            };

            const completeResponse = await fetch('https://localhost:7072/api/webauthn/authenticate/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(assertionResponse)
            });

            if (!completeResponse.ok) {
                const errorText = await completeResponse.text();
                throw new Error('Authentication tamamlanamadı: ' + errorText);
            }

            console.log('WebAuthn Helper: Authentication completed successfully!');

            return assertion;
            
        } catch (error) {
            console.error('WebAuthn Helper: Our authentication failed:', error);
            // Make sure WebAuthn is blocked again even in case of error
            applyWebAuthnBlocking();
            console.log('WebAuthn Helper: WebAuthn APIs blocked again after authentication error');
            throw error;
        }
    }

    // Function to show notifications
    function showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.webauthn-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = 'webauthn-notification';
        
        let backgroundColor, textColor;
        switch(type) {
            case 'success':
                backgroundColor = '#e6f4ea';
                textColor = '#137333';
                break;
            case 'error':
                backgroundColor = '#fce8e6';
                textColor = '#c5221f';
                break;
            case 'info':
                backgroundColor = '#e8f0fe';
                textColor = '#1967d2';
                break;
            default:
                backgroundColor = '#e6f4ea';
                textColor = '#137333';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px;
            background: ${backgroundColor};
            color: ${textColor};
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Event handler function (defined separately so we can remove it)
    async function handleDocumentClick(event) {
            const target = event.target;
            
            // Register button
            if (target.matches('#register') || target.textContent.toLowerCase().includes('register')) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                const username = getUsernameFromPage();
                console.log('Register button clicked for username:', username);
                
                const confirmed = await showConfirmationDialog('register', username);
                if (confirmed) {
                    await handleWebAuthnRegister(username);
                }
                return false;
            }
            
            // Login button
            if (target.matches('#login') || target.textContent.toLowerCase().includes('login') || target.textContent.toLowerCase().includes('authenticate')) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                console.log('Login button clicked');
                
                // Show user selection popup instead of asking for username
                showUserSelectionPopup();
                return false;
            }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Remove any existing listener first
        document.removeEventListener('click', handleDocumentClick, true);
        
        // Add our event listener with capture=true to catch events before they reach the target
        document.addEventListener('click', handleDocumentClick, true);

        console.log('WebAuthn Helper: Event listeners setup complete');
    }

    // Add state management variables at the top level
    let isCleaningUp = false;
    let lastCleanupTime = 0;
    const CLEANUP_INTERVAL = 5000; // 5 seconds

    // Move cleanup function to top level
    async function forceCleanupWebAuthnState() {
        if (isCleaningUp || Date.now() - lastCleanupTime < CLEANUP_INTERVAL) {
            console.log('WebAuthn Helper: Cleanup already in progress or too soon');
            return;
        }

        isCleaningUp = true;
        lastCleanupTime = Date.now();

        try {
            console.log('WebAuthn Helper: Starting forced cleanup...');
            window.enableWebAuthnForExtension();

            // Force cancel any existing operations
            if (navigator.credentials) {
                try {
                    const dummyOptions = {
                        publicKey: {
                            challenge: new Uint8Array(32),
                            rp: { name: "dummy", id: "localhost" },
                            user: { id: new Uint8Array(16), name: "dummy", displayName: "dummy" },
                            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                            timeout: 1
                        }
                    };

                    await Promise.race([
                        navigator.credentials.create(dummyOptions),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
                    ]).catch(() => {
                        // Expected to fail, just clearing state
                        console.log('WebAuthn Helper: Successfully cleared pending operations');
                    });
                } catch (e) {
                    console.log('WebAuthn Helper: Error during cleanup (expected):', e.message);
                }
            }

            // Additional delay for state to settle
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (e) {
            console.error('WebAuthn Helper: Cleanup error:', e);
        } finally {
            window.disableWebAuthnAfterUse();
            isCleaningUp = false;
        }
    }

    // Make cleanup function available globally
    window.forceCleanupWebAuthnState = forceCleanupWebAuthnState;

    // Check for pending actions after page refresh
    function checkPendingActions() {
        const pendingAction = sessionStorage.getItem('webauthn_pending_action');
        if (pendingAction) {
            try {
                const action = JSON.parse(pendingAction);
                const actionTime = new Date(action.timestamp);
                const now = new Date();
                
                if (now - actionTime < 60000) { // 1 minute timeout
                    setTimeout(async () => {
                        console.log('WebAuthn Helper: Starting pending action execution...');
                        
                        try {
                            await forceCleanupWebAuthnState();
                            
                            if (action.action === 'register') {
                                await handleWebAuthnRegister(action.username);
                            } else if (action.action === 'authenticate') {
                                await handleWebAuthnAuthenticate(action.username);
                            }
                        } catch (e) {
                            console.error('WebAuthn Helper: Error executing pending action:', e);
                            showNotification('WebAuthn işlemi başarısız: ' + e.message, 'error');
                        }
                    }, 10000);
                }
            } catch (e) {
                console.error('WebAuthn Helper: Error handling pending action:', e);
                sessionStorage.removeItem('webauthn_pending_action');
            }
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupEventListeners();
            checkPendingActions();
        });
    } else {
        setupEventListeners();
        checkPendingActions();
    }

    console.log('WebAuthn Helper: Content script fully initialized with ultra aggressive WebAuthn protection');

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === 'REGISTER_USER') {
            console.log('WebAuthn Helper: Received register request from popup for:', request.username);
            handleWebAuthnRegister(request.username);
            sendResponse({ success: true });
        } else if (request.type === 'LOGIN_USER') {
            console.log('WebAuthn Helper: Received login request from popup for:', request.username);
            handleWebAuthnAuthenticate(request.username);
            sendResponse({ success: true });
        }
        return true; // Keep the message channel open for async response
    });

})(); 