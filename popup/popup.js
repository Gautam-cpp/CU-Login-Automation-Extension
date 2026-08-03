document.addEventListener('DOMContentLoaded', function () {
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const saveButton = document.getElementById('saveButton');
    const editButton = document.getElementById('editButton');
    const togglePasswordButton = document.getElementById('togglePassword');
    const loginForm = document.getElementById('login-form');
    const savedCredentials = document.getElementById('saved-credentials');
    const autoLoginToggleSaved = document.getElementById('autoLoginToggleSaved');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const darkModeToggleSaved = document.getElementById('darkModeToggleSaved');
    const toastContainer = document.getElementById('toast-container');

    function applyDarkModeUI(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (themeToggleBtn) themeToggleBtn.querySelector('i').className = 'fas fa-sun';
            if (darkModeToggleSaved) darkModeToggleSaved.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggleBtn) themeToggleBtn.querySelector('i').className = 'fas fa-moon';
            if (darkModeToggleSaved) darkModeToggleSaved.checked = false;
        }
    }

    function toggleDarkMode(isDark) {
        chrome.storage.local.set({ darkModeEnabled: isDark }, function () {
            applyDarkModeUI(isDark);
            showToast(isDark ? 'Dark mode enabled' : 'Dark mode disabled', 'success');
        });
    }

    // Load saved data
    chrome.storage.local.get(['userId', 'password', 'autoLoginEnabled', 'darkModeEnabled'], function (result) {
        if (result.userId && result.password) {
            showSavedState();
        } else {
            showLoginForm();
        }

        if (autoLoginToggleSaved) {
            autoLoginToggleSaved.checked = result.autoLoginEnabled !== false; // Default to true
        }

        applyDarkModeUI(!!result.darkModeEnabled);
    });

    // Theme toggle button click
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function () {
            const currentDark = document.body.classList.contains('dark-mode');
            toggleDarkMode(!currentDark);
        });
    }

    // Settings card dark mode toggle change
    if (darkModeToggleSaved) {
        darkModeToggleSaved.addEventListener('change', function () {
            toggleDarkMode(this.checked);
        });
    }

    // Auto-login toggle handler
    if (autoLoginToggleSaved) {
        autoLoginToggleSaved.addEventListener('change', function () {
            const autoLoginEnabled = this.checked;
            chrome.storage.local.set({ autoLoginEnabled });

            if (autoLoginEnabled) {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    if (tabs[0]) {
                        chrome.tabs.reload(tabs[0].id);
                    }
                });
                showToast('Auto-login enabled', 'success');
            } else {
                showToast('Auto-login disabled', 'success');
            }
        });
    }

    // Toggle password visibility
    togglePasswordButton.addEventListener('click', function () {
        const icon = togglePasswordButton.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });

    // Save credentials
    saveButton.addEventListener('click', function () {
        const userId = userIdInput.value.trim();
        const password = passwordInput.value.trim();

        if (!userId || !password) {
            showToast('Please enter both User ID and Password', 'error');
            // Shake animation for inputs could be added here
            return;
        }

        // Set loading state
        saveButton.classList.add('loading');
        saveButton.disabled = true;

        // Simulate network/storage delay for better UX
        setTimeout(() => {
            chrome.storage.local.set({ userId, password }, function () {
                saveButton.classList.remove('loading');
                saveButton.disabled = false;

                showToast('Credentials saved successfully!', 'success');

                setTimeout(() => {
                    showSavedState();
                }, 500);
            });
        }, 800);
    });

    // Edit credentials
    editButton.addEventListener('click', function () {
        chrome.storage.local.get(['userId', 'password'], function (result) {
            userIdInput.value = result.userId || '';
            passwordInput.value = result.password || '';
            showLoginForm();
        });
    });

    // Enter key support
    [userIdInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                saveButton.click();
            }
        });

        // Focus effects handled by CSS, but we can add validation logic here if needed
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

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';

        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);

        toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                if (toast.parentNode) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
});

