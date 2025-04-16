async function autoLogin() {
    try {
      // Get credentials from storage
      const credentials = await new Promise((resolve) => {
        chrome.runtime.sendMessage({action: "getCredentials"}, (response) => {
          resolve(response);
        });
      });
  
      if (!credentials.userId || !credentials.password) {
        console.log("Credentials not found. Please set up the extension first.");
        return;
      }
  
      // Logic for the first login page (UserID)
      if (document.querySelector('#txtUserId')) {
        document.querySelector('#txtUserId').value = credentials.userId;
        const nextButton = document.querySelector('#btnNext');
        if (nextButton) nextButton.click();
        return;
      }
  
      // Logic for the second login page (Password + Captcha)
      if (document.querySelector('#txtLoginPassword')) {
        document.querySelector('#txtLoginPassword').value = credentials.password;
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
  
  // Function to solve captcha using Tesseract.js
  async function solveCaptcha() {
    try {
      // Wait for captcha image
      const captchaImg = await waitForElement('#imgCaptcha', 10000);
      
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match the captcha image
      canvas.width = captchaImg.width;
      canvas.height = captchaImg.height;
      
      // Draw the image on the canvas
      ctx.drawImage(captchaImg, 0, 0);
      
      // Get the image data as a base64 string
      const imageData = canvas.toDataURL('image/png');
      
      // Recognize text using Tesseract.js
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        { logger: m => console.log(m) }
      );
      
      // Clean up the recognized text
      let captchaText = result.data.text.replace(/\s/g, '').trim();
      
      if (!captchaText) {
        throw new Error('Captcha recognition failed');
      }
      
      // Fill the captcha field
      const captchaField = await waitForElement('#txtcaptcha', 5000);
      captchaField.value = captchaText;
      
      return captchaText;
    } catch (error) {
      console.error("Captcha solving error:", error);
      throw error;
    }
  }
  

  document.addEventListener('DOMContentLoaded', autoLogin);
  
  // Also run it now in case the page is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    autoLogin();
  } else {
    document.addEventListener('DOMContentLoaded', autoLogin);
  }