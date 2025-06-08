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
          showSavedState();
      } else {
          showLoginForm();
      }
  });
  
  togglePasswordButton.addEventListener('click', function() {
      const icon = togglePasswordButton.querySelector('i');
      if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.className = 'fas fa-eye-slash';
      } else {
          passwordInput.type = 'password';
          icon.className = 'fas fa-eye';
      }
  });
  
  saveButton.addEventListener('click', function() {
      const userId = userIdInput.value.trim();
      const password = passwordInput.value.trim();
      
      if (!userId || !password) {
          showStatus('Please enter both User ID and Password', 'error');
          return;
      }
      
      saveButton.classList.add('loading');
      saveButton.disabled = true;
      
      setTimeout(() => {
          chrome.storage.local.set({ userId, password }, function() {
              saveButton.classList.remove('loading');
              saveButton.disabled = false;
              
              showStatus('Credentials saved successfully!', 'success');
              
              setTimeout(() => {
                  showSavedState();
              }, 1500);
          });
      }, 800);
  });
  

  editButton.addEventListener('click', function() {
      chrome.storage.local.get(['userId', 'password'], function(result) {
          userIdInput.value = result.userId || '';
          passwordInput.value = result.password || '';
          showLoginForm();
      });
  });
  

  [userIdInput, passwordInput].forEach(input => {
      input.addEventListener('input', function() {
          if (this.value.trim()) {
              this.style.borderColor = '#28a745';
          } else {
              this.style.borderColor = '#e1e5e9';
          }
      });
      
      input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              saveButton.click();
          }
      });
  });
  

  function showLoginForm() {
      loginForm.style.display = 'block';
      savedCredentials.style.display = 'none';
      userIdInput.focus();
  }
  
  function showSavedState() {
      loginForm.style.display = 'none';
      savedCredentials.style.display = 'block';
  }
  
  function showStatus(message, type) {
      statusMessage.textContent = message;
      statusMessage.className = `status-message ${type}`;
      statusMessage.style.display = 'block';
      
      setTimeout(() => {
          statusMessage.style.display = 'none';
      }, 4000);
  }
});
