// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'SHOW_REGISTER_POPUP') {
    // Update popup URL to show registration form
    chrome.storage.local.set({ 'popupMode': 'register' });
  }
  else if (message.type === 'SHOW_LOGIN_POPUP') {
    // Update popup URL to show login form
    chrome.storage.local.set({ 'popupMode': 'login' });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'REGISTRATION_COMPLETE') {
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'REGISTRATION_COMPLETE' });
    });
  }
  else if (message.type === 'AUTHENTICATION_COMPLETE') {
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'AUTHENTICATION_COMPLETE' });
    });
  }
}); 