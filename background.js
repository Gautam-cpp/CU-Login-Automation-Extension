
chrome.runtime.onInstalled.addListener(() => {
    // Check if credentials are already stored
    chrome.storage.local.get(['userId', 'password'], (result) => {
      if (!result.userId || !result.password) {
        chrome.action.openPopup();
      }
    });
  });
  
  // Listen for messages from content script or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCredentials") {
      chrome.storage.local.get(['userId', 'password'], (result) => {
        sendResponse(result);
      });
      return true; 
    }
  });
  