document.addEventListener('DOMContentLoaded', function() {
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const saveButton = document.getElementById('saveButton');
    const editButton = document.getElementById('editButton');
    const togglePasswordButton = document.getElementById('togglePassword');
    const loginForm = document.getElementById('login-form');
    const savedCredentials = document.getElementById('saved-credentials');
    const statusMessage = document.getElementById('status-message');
    
  
    chrome.storage.local.get(['userId', 'password'], function(result) {
      if (result.userId && result.password) {
        loginForm.style.display = 'none';
        savedCredentials.style.display = 'block';
      } else {
        loginForm.style.display = 'block';
        savedCredentials.style.display = 'none';
      }
    });
    
    
    togglePasswordButton.addEventListener('click', function() {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordButton.textContent = 'Hide';
      } else {
        passwordInput.type = 'password';
        togglePasswordButton.textContent = 'Show';
      }
    });
    
    saveButton.addEventListener('click', function() {
      const userId = userIdInput.value.trim();
      const password = passwordInput.value.trim();
      
      if (!userId || !password) {
        showStatus('Please enter both User ID and Password', 'error');
        return;
      }
      
      chrome.storage.local.set({ userId, password }, function() {
        showStatus('Credentials saved successfully!', 'success');
        
        setTimeout(() => {
          loginForm.style.display = 'none';
          savedCredentials.style.display = 'block';
        }, 1500);
      });
    });
    
   
    editButton.addEventListener('click', function() {
      chrome.storage.local.get(['userId', 'password'], function(result) {
        userIdInput.value = result.userId || '';
        passwordInput.value = result.password || '';
        
        loginForm.style.display = 'block';
        savedCredentials.style.display = 'none';
      });
    });
    
    
    function showStatus(message, type) {
      statusMessage.textContent = message;
      statusMessage.className = type;
      statusMessage.style.display = 'block';
      
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 3000);
    }
  });