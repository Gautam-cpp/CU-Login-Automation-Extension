# CU Login Assistant Chrome Extension

CU Login Assistant is a Chrome extension that automates the login process for the Chandigarh University student portal (students.cuchd.in). It securely stores your credentials, auto-fills your login details, solves the captcha using Tesseract.js, and logs you in with a single click.

## 🚀 Features

- Securely saves your User ID and Password in your browser
- Automatically fills in your credentials on the login page
- Captures and solves captcha using Tesseract.js
- One-click login experience for Chandigarh University students

## 🛠️ Installation Guide

### 1. Download or Clone the Repository

```bash
git clone [https://github.com/Gautam-cpp/CU-Login-Automation-Extension.git]
```

Or simply download the ZIP and extract it.

### 3. Load the Extension in Chrome

- Open Chrome and go to chrome://extensions/
- Enable Developer mode (toggle in the top right)
- Click on Load unpacked
- Select the cu-login-extension folder

### 4. Set Up Your Credentials

- Click the CU Login Assistant extension icon in your Chrome toolbar.
- Enter your User ID and Password in the popup.
- Click Save Credentials.
- Your credentials are now securely stored in your browser.

### 5. Usage

Visit the official cuims page

The extension will automatically:
- Fill in your User ID and Password
- Solve the captcha
- Log you in!

## ⚠️ Security Notice

- Your credentials are stored locally in your browser using Chrome's secure storage.
- This extension does not transmit your credentials anywhere else.
- For your safety, always use extensions from trusted sources and review the code if possible.

## 🧩 Troubleshooting

If the extension doesn't work, make sure:
- You have entered the correct credentials.
- The captcha image is visible and not blocked by the browser.
- You have the latest Tesseract.js in the lib/ folder.
- If the portal layout changes, the extension may need to be updated.
