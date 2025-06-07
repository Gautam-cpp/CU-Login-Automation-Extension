async function autoLogin() {
  try {
    const credentials = await new Promise((resolve) => {
      chrome.runtime.sendMessage({action: "getCredentials"}, (response) => {
        resolve(response);
      });
    });

    if (!credentials.userId || !credentials.password) {
      console.log("Credentials not found. Please set up the extension first.");
      return;
    }

    if (document.querySelector('#txtUserId')) {
      document.querySelector('#txtUserId').value = credentials.userId;
      await new Promise(resolve => setTimeout(resolve, randomDelay()));
      const nextButton = document.querySelector('#btnNext');
      if (nextButton) nextButton.click();
      return;
    }

    if (document.querySelector('#txtLoginPassword')) {
      document.querySelector('#txtLoginPassword').value = credentials.password;
      await new Promise(resolve => setTimeout(resolve, randomDelay()));
      await solveCaptcha();
      const loginButton = document.querySelector('#btnLogin');
      if (loginButton) loginButton.click();
      return;
    }

    console.log('No known login fields found on this page.');

  } catch (error) {
    console.error("Login automation error:", error);
  }
}

function randomDelay() {
  return Math.random() * 1000 + 500;
}

function waitForElement(selector, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${selector}`));
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
}

async function loadTesseract() {
  if (!window.Tesseract) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }
  return window.Tesseract;
}

function enhanceImage(ctx, imageData) {
  let data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const enhanced = gray < 100 ? 0 : (gray > 180 ? 255 : gray * 1.5);
    const threshold = enhanced > 128 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = threshold;
  }
  
  return imageData;
}

async function solveCaptcha(maxRetries = 3) {
  const Tesseract = await loadTesseract();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const captchaImg = await waitForElement('#imgCaptcha', 5000);

      await new Promise(resolve => {
        if (captchaImg.complete) {
          resolve();
        } else {
          captchaImg.onload = resolve;
        }
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = captchaImg.width;
      canvas.height = captchaImg.height;

      ctx.drawImage(captchaImg, 0, 0, canvas.width, canvas.height);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imageData = enhanceImage(ctx, imageData);
      ctx.putImageData(imageData, 0, 0);

      const processedImage = canvas.toDataURL('image/png');

      const result = await Tesseract.recognize(
        processedImage,
        'eng',
        { 
          logger: m => console.log(m),
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_WORD
        }
      );

      let rawText = result.data.text;
      let captchaText = (rawText.match(/[A-Za-z0-9]/g) || []).join('').slice(0, 4);

      if (captchaText.length !== 4) {
        throw new Error(`Captcha recognition failed or incomplete: "${captchaText}"`);
      }

      const captchaField = await waitForElement('#txtcaptcha', 5000);
      captchaField.value = captchaText;

      return captchaText;
    } catch (error) {
      console.log(`Captcha attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) throw error;
      
      const refreshBtn = document.querySelector('#refreshCaptcha, #btnRefreshCaptcha, .refresh-captcha');
      if (refreshBtn) {
        refreshBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

function isLoginPage() {
  return document.querySelector('#txtUserId') || 
         document.querySelector('#txtLoginPassword');
}

function initializeAutoLogin() {
  if (isLoginPage()) {
    autoLogin();
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeAutoLogin();
} else {
  document.addEventListener('DOMContentLoaded', initializeAutoLogin);
}
