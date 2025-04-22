async function autoLogin() {
  try {
    const credentials = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getCredentials" }, (response) => {
        resolve(response);
      });
    });

    if (!credentials.userId || !credentials.password) {
      console.log("Credentials not found. Please set up the extension first.");
      return;
    }

    if (document.querySelector('#txtUserId')) {
      document.querySelector('#txtUserId').value = credentials.userId;
      const nextButton = document.querySelector('#btnNext');
      if (nextButton) nextButton.click();
      return;
    }

    if (document.querySelector('#txtLoginPassword')) {
      document.querySelector('#txtLoginPassword').value = credentials.password;
      await solveCaptcha();
      const loginButton = document.querySelector('#btnLogin');
      if (loginButton) loginButton.click();
      return;
    }

    if (window.location.href.includes('StudentHome.aspx')) {
      console.log('On student home page, checking for feedback form...');
      setTimeout(handleFeedbackForm, 2000);
    }

    console.log('No known login fields found on this page.');
  } catch (error) {
    console.error("Login automation error:", error);
  }
}

async function handleFeedbackForm() {
  try {
    console.log('Checking for feedback form...');
    const accordionCourses = document.getElementById('accordionCourses');
    if (!accordionCourses) {
      console.log('No feedback form found');
      return;
    }

    console.log('Feedback form found, processing...');
    const activePanel = document.querySelector('.ui-accordion-content-active');
    if (!activePanel) {
      console.log('No active panel found');
      return;
    }

    const radioGroups = activePanel.querySelectorAll('table[id*="rblResponse"]');
    console.log(`Found ${radioGroups.length} question groups`);

    radioGroups.forEach((table, index) => {
      const radioButtons = table.querySelectorAll('input[type="radio"]');
      if (radioButtons.length >= 3) {
        const neutralRadio = radioButtons[2];
        neutralRadio.checked = true;
        const event = new Event('change', { bubbles: true });
        neutralRadio.dispatchEvent(event);
        console.log(`Selected Neutral for question ${index + 1}`);
      }
    });

    setTimeout(() => {
      const submitButton = activePanel.querySelector('input[type="submit"][value="Submit Now"]');
      if (submitButton) {
        console.log('Clicking submit button...');
        submitButton.click();
        setTimeout(checkForMoreForms, 2000);
      } else {
        console.log('Submit button not found');
      }
    }, 1000);
  } catch (error) {
    console.error("Feedback form automation error:", error);
  }
}

function checkForMoreForms() {
  const nextHeader = document.querySelector('.ui-accordion-header:not(.ui-state-active)');
  if (nextHeader) {
    console.log('Found another feedback form, clicking to open...');
    nextHeader.click();
    setTimeout(handleFeedbackForm, 1500);
  } else {
    console.log('No more feedback forms to fill');
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

async function solveCaptcha() {
  try {
    const captchaImg = await waitForElement('#imgCaptcha', 10000);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = captchaImg.width;
    canvas.height = captchaImg.height;
    ctx.drawImage(captchaImg, 0, 0);
    const imageData = canvas.toDataURL('image/png');
    const result = await Tesseract.recognize(
      imageData,
      'eng',
      { logger: m => console.log(m) }
    );
    let captchaText = result.data.text.replace(/\s/g, '').trim();
    if (!captchaText) {
      throw new Error('Captcha recognition failed');
    }
    const captchaField = await waitForElement('#txtcaptcha', 5000);
    captchaField.value = captchaText;
    return captchaText;
  } catch (error) {
    console.error("Captcha solving error:", error);
    throw error;
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  autoLogin();
} else {
  document.addEventListener('DOMContentLoaded', autoLogin);
}
