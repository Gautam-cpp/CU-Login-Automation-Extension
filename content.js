async function autoLogin() {
  try {
    const credentials = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getCredentials" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("CU Login Assistant: Error getting credentials:", chrome.runtime.lastError);
          resolve({});
        } else {
          resolve(response || {});
        }
      });
    });

    console.log("CU Login Assistant: Received credentials check.", credentials);

    if (credentials.autoLoginEnabled === false) {
      console.log("CU Login Assistant: Auto-login is manually disabled.");
      return;
    }

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

async function solveCaptcha(maxRetries = 5) {
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

/* ==========================================================================
   Dark Mode — Premium Native Theme for CUIMS Portal
   Designed to feel like official first-party dark mode support.
   ========================================================================== */
const DARK_MODE_STYLE_ID = 'cu-assistant-dark-mode-style';

const DARK_MODE_CSS = `
/* ══════════════════════════════════════════════════════════════════════════
   CU Login Assistant — True Dark Mode for CUIMS Portal
   Palette: #0d1117 → #161b22 → #1c2128 → #21262d (neutral dark, zero blue tint)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Smooth transitions on toggle ─────────────────────────────────────── */
*, *::before, *::after {
  transition: background-color 0.3s ease, color 0.2s ease, border-color 0.25s ease, box-shadow 0.25s ease !important;
}

/* ── Nuclear reset: catch EVERYTHING with a white/light background ────── */
html, body, body.body-gradient, body.loaded,
form, #form1, #aspnetForm,
.main-panel, .wrapper, .page-wrapper, .content,
.container, .container-fluid, .row,
.page-body, .main-content, .pcoded-main-container,
.pcoded-wrapper, .pcoded-content, .pcoded-inner-content,
#MainContent, [id*="MainContent"], [id*="ContentPlaceHolder"],
[id*="pnl"], [id*="Panel"], [id*="div"],
.body-gradient {
  background-color: #0d1117 !important;
  background-image: none !important;
  color: #c9d1d9 !important;
}

/* ── Catch every div/td/span with inline white backgrounds ────────────── */
[style*="background-color: white"],
[style*="background-color:white"],
[style*="background-color: #fff"],
[style*="background-color:#fff"],
[style*="background-color: #FFF"],
[style*="background-color:#FFF"],
[style*="background-color: rgb(255"],
[style*="background: white"],
[style*="background:white"],
[style*="background: #fff"],
[style*="background:#fff"],
[style*="background: #FFF"],
[style*="background:#FFF"],
[style*="background: rgb(255"],
[style*="background-color: #ffffff"],
[style*="background-color:#ffffff"],
[style*="background-color: #FFFFFF"],
[style*="background-color:#FFFFFF"] {
  background-color: #161b22 !important;
  color: #c9d1d9 !important;
}

/* Light grays */
[style*="background-color: #f"],
[style*="background-color:#f"],
[style*="background-color: #F"],
[style*="background-color:#F"],
[style*="background-color: #e"],
[style*="background-color:#e"],
[style*="background-color: #E"],
[style*="background-color:#E"],
[style*="background-color: rgb(24"],
[style*="background-color: rgb(23"],
[style*="background-color: rgb(22"],
[style*="background-color: rgb(21"],
[style*="background-color: rgb(20"],
[style*="background: #f"],
[style*="background:#f"],
[style*="background: #e"],
[style*="background:#e"] {
  background-color: #161b22 !important;
}

/* ── Top Header / Navbar ──────────────────────────────────────────────── */
.navbar, .navbar-default, .navbar-fixed-top, .navbar-static-top,
nav.navbar, header, #header, .top-header,
[class*="header"], [class*="topbar"], [class*="top-bar"],
.navbar-collapse, .navbar-nav, .navbar-inner,
.navbar-header, .nav-header {
  background-color: #161b22 !important;
  background-image: none !important;
  border-bottom: 1px solid #30363d !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
}

.navbar a, .navbar span, .navbar .nav > li > a,
nav a, header a, header span, .navbar-brand {
  color: #c9d1d9 !important;
}

.navbar a:hover, .navbar .nav > li > a:hover,
nav a:hover, header a:hover {
  color: #ffffff !important;
  background-color: #21262d !important;
}

/* Search bar in header */
.navbar input, .navbar input[type="text"], .navbar input[type="search"],
input[id*="search" i], input[id*="Search" i],
[class*="search"] input, .form-control[type="search"] {
  background-color: #0d1117 !important;
  border: 1px solid #30363d !important;
  color: #c9d1d9 !important;
  border-radius: 6px !important;
}

.navbar input::placeholder, [class*="search"] input::placeholder {
  color: #484f58 !important;
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */
#sidebar, .sidebar, .left-side, .left-sidebar,
.side-nav, .navigation, [class*="sidebar"],
.sidenav, aside, .main-menu, .menu-bar,
.pcoded-navbar, .pcoded-inner-navbar,
.slimScrollDiv, .scroll-sidebar, .sidebar-nav,
.nav-sidebar {
  background-color: #0d1117 !important;
  background-image: none !important;
  border-right: 1px solid #21262d !important;
  box-shadow: none !important;
}

/* Sidebar links */
#sidebar a, .sidebar a, aside a,
.side-nav a, .navigation a, [class*="sidebar"] a,
.pcoded-inner-navbar a, .pcoded-inner-navbar li a,
.sidebar-nav a, .menu-item, .nav-link,
ul.nav li a, .sidebar ul li a, aside ul li a {
  color: #8b949e !important;
  border-color: transparent !important;
}

#sidebar a:hover, .sidebar a:hover, aside a:hover,
.side-nav a:hover, .navigation a:hover, [class*="sidebar"] a:hover,
.pcoded-inner-navbar a:hover, .sidebar-nav a:hover,
ul.nav li a:hover, .sidebar ul li a:hover, aside ul li a:hover {
  color: #f0f6fc !important;
  background-color: #161b22 !important;
}

/* Active sidebar */
#sidebar .active > a, .sidebar .active > a,
.side-nav .active a, .nav li.active a,
[class*="sidebar"] .active a, aside .active > a {
  color: #ffffff !important;
  background-color: rgba(224, 4, 4, 0.15) !important;
  border-left: 3px solid #E00404 !important;
}

/* Sidebar icons */
#sidebar i, .sidebar i, aside i,
.side-nav i, .navigation i, [class*="sidebar"] i,
.pcoded-inner-navbar i, .sidebar-nav i {
  color: #484f58 !important;
}

#sidebar a:hover i, .sidebar a:hover i, aside a:hover i {
  color: #8b949e !important;
}

/* Sidebar sub-menus */
.pcoded-hasmenu .pcoded-submenu, .sub-menu,
.sidebar .collapse, .sidebar .panel-collapse,
ul.sub-menu, .treeview-menu {
  background-color: #010409 !important;
}

/* Sidebar dividers */
#sidebar li, .sidebar li, aside li,
.sidebar .nav > li, #sidebar .nav > li {
  border-color: #21262d !important;
}

/* ── Quick Link Cards (Important Links / Student Facilitation / etc.) ──── */
[class*="important"], [class*="quick-link"],
.col-md-2 > div, .col-md-3 > div,
.col-lg-2 > div, .col-lg-3 > div,
.col-sm-2 > div, .col-sm-3 > div {
  border-color: #30363d !important;
}

/* ── Cards, Panels, Boxes, Widgets — the main containers ──────────────── */
.card, .panel, .panel-default, .panel-body, .panel-heading, .panel-footer,
.box, .widget, .well, .jumbotron, .tile,
.list-group-item, .modal-content,
[class*="card"], [class*="panel"], [class*="widget"],
[class*="box-"], [class*="-box"] {
  background-color: #161b22 !important;
  background-image: none !important;
  color: #c9d1d9 !important;
  border: 1px solid #21262d !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
}

.panel-heading, .card-header, [class*="card-head"],
[class*="panel-head"], .box-header {
  background-color: #1c2128 !important;
  background-image: none !important;
  border-bottom: 1px solid #21262d !important;
}

.panel-footer, .card-footer, [class*="card-foot"],
[class*="panel-foot"], .box-footer {
  background-color: #1c2128 !important;
  border-top: 1px solid #21262d !important;
}

/* ── Weather/University Info Strip ─────────────────────────────────────── */
[style*="linear-gradient"], [class*="weather"],
[class*="chandigarh"], .marquee-container, [class*="marquee"] {
  opacity: 0.88;
}

/* ── Download Virtual ID Card bar ─────────────────────────────────────── */
.bg-white {
  background-color: #161b22 !important;
}

.bg-light, .bg-secondary {
  background-color: #0d1117 !important;
}

/* ── Section Headings ─────────────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
  color: #e6edf3 !important;
}

.card-title, .panel-title, .box-title {
  color: #e6edf3 !important;
}

/* ── General Text ─────────────────────────────────────────────────────── */
body, div, span, p, li, label, strong, b, em,
i:not(.fa):not(.fas):not(.far):not(.fab):not(.fal) {
  color: #c9d1d9 !important;
}

td, th {
  color: #c9d1d9 !important;
}

small, .text-muted, .help-block, .form-text {
  color: #6e7681 !important;
}

/* ── Links ────────────────────────────────────────────────────────────── */
a {
  color: #58a6ff !important;
}

a:hover {
  color: #79c0ff !important;
}

/* Preserve red text branding */
a[style*="color: red"], a[style*="color:#E00404"],
.text-danger, .text-red, .label-danger {
  color: #f85149 !important;
}

.text-success {
  color: #3fb950 !important;
}

.text-warning {
  color: #d29922 !important;
}

.text-info {
  color: #58a6ff !important;
}

/* ── Tables ───────────────────────────────────────────────────────────── */
table, .table {
  background-color: #161b22 !important;
  border-color: #21262d !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
}

thead, thead tr, thead th,
.table > thead > tr > th,
.table > thead > tr > td {
  background-color: #1c2128 !important;
  color: #8b949e !important;
  border-bottom: 2px solid #30363d !important;
  border-color: #30363d !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  font-size: 0.78em !important;
  letter-spacing: 0.05em !important;
}

td, th,
.table > tbody > tr > td, .table > tbody > tr > th,
.table > tfoot > tr > td, .table > tfoot > tr > th {
  background-color: transparent !important;
  border-color: #21262d !important;
  color: #c9d1d9 !important;
}

tbody tr {
  background-color: #161b22 !important;
}

tbody tr:nth-child(even),
.table-striped > tbody > tr:nth-of-type(even) {
  background-color: #1c2128 !important;
}

tbody tr:hover, .table-hover > tbody > tr:hover {
  background-color: #21262d !important;
}

/* ── Announcements / Notices ──────────────────────────────────────────── */
[class*="announcement"], [class*="notice"],
[class*="event"], [class*="alert-info"],
.list-group-item, .alert {
  background-color: #161b22 !important;
  border-color: #21262d !important;
  color: #c9d1d9 !important;
}

/* Date badges */
[class*="badge"], .badge, .label:not(label), .tag,
span[class*="badge"] {
  opacity: 0.92;
}

/* ── Form Inputs ──────────────────────────────────────────────────────── */
input[type="text"], input[type="password"], input[type="email"],
input[type="number"], input[type="tel"], input[type="url"],
input[type="search"], input[type="date"], input[type="datetime-local"],
input[type="time"], input[type="month"], input[type="week"],
select, textarea, .form-control {
  background-color: #0d1117 !important;
  color: #c9d1d9 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

input::placeholder, textarea::placeholder {
  color: #484f58 !important;
}

input:focus, select:focus, textarea:focus, .form-control:focus {
  border-color: #E00404 !important;
  box-shadow: 0 0 0 3px rgba(224, 4, 4, 0.15) !important;
  outline: none !important;
}

select option {
  background-color: #161b22 !important;
  color: #c9d1d9 !important;
}

/* ── Buttons ──────────────────────────────────────────────────────────── */
.btn-default, .btn-secondary, .btn-light {
  background-color: #21262d !important;
  color: #c9d1d9 !important;
  border: 1px solid #30363d !important;
}

.btn-default:hover, .btn-secondary:hover, .btn-light:hover {
  background-color: #30363d !important;
  color: #f0f6fc !important;
}

.btn-primary {
  background-color: #c00303 !important;
  border-color: #c00303 !important;
  color: #ffffff !important;
}

.btn-primary:hover {
  background-color: #a50303 !important;
}

.btn-success {
  background-color: #238636 !important;
  border-color: #238636 !important;
}

.btn-info {
  background-color: #1f6feb !important;
  border-color: #1f6feb !important;
}

.btn-warning {
  background-color: #9e6a03 !important;
  border-color: #9e6a03 !important;
}

/* ── Modals / Dropdowns ───────────────────────────────────────────────── */
.modal-content, .popover, .tooltip-inner,
.dropdown-menu, .dropdown-menu li a {
  background-color: #161b22 !important;
  color: #c9d1d9 !important;
  border-color: #30363d !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
}

.modal-header, .modal-footer {
  border-color: #21262d !important;
  background-color: #1c2128 !important;
}

.modal-backdrop {
  background-color: rgba(1, 4, 9, 0.8) !important;
}

.dropdown-menu li a:hover, .dropdown-menu > li > a:hover {
  background-color: #21262d !important;
  color: #f0f6fc !important;
}

/* ── Tabs & Navs ──────────────────────────────────────────────────────── */
.nav-tabs, .nav-pills {
  border-color: #21262d !important;
}

.nav-tabs > li > a, .nav-pills > li > a {
  color: #8b949e !important;
}

.nav-tabs > li.active > a, .nav-pills > li.active > a,
.nav-tabs > li > a:hover, .nav-pills > li > a:hover {
  background-color: #161b22 !important;
  color: #f0f6fc !important;
  border-color: #21262d !important;
}

/* ── Pagination ───────────────────────────────────────────────────────── */
.pagination > li > a, .pagination > li > span {
  background-color: #161b22 !important;
  border-color: #21262d !important;
  color: #8b949e !important;
}

.pagination > li.active > a, .pagination > li.active > span {
  background-color: #c00303 !important;
  border-color: #c00303 !important;
  color: #fff !important;
}

.pagination > li > a:hover {
  background-color: #21262d !important;
  color: #f0f6fc !important;
}

/* ── Breadcrumbs ──────────────────────────────────────────────────────── */
.breadcrumb {
  background-color: #0d1117 !important;
}

.breadcrumb > li, .breadcrumb > li > a {
  color: #8b949e !important;
}

/* ── Progress bars ────────────────────────────────────────────────────── */
.progress {
  background-color: #21262d !important;
}

/* ── Horizontal rules & borders ───────────────────────────────────────── */
hr {
  border-color: #21262d !important;
}

/* ── Images — slight dim ──────────────────────────────────────────────── */
img:not([src*="logo"]):not([src*="icon"]):not([src*="captcha"]):not([id*="captcha"]):not([src*="Logo"]) {
  opacity: 0.85;
}

/* ── CU LMS red card — keep accent ────────────────────────────────────── */
[style*="background-color: #E00404"],
[style*="background-color:#E00404"],
[style*="background: #E00404"],
[style*="background:#E00404"],
[style*="background-color: #e00404"],
[style*="background-color:#e00404"] {
  background-color: #b90303 !important;
}

/* ── Scrollbars ───────────────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #0d1117;
}
::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}

/* ── Selection ────────────────────────────────────────────────────────── */
::selection {
  background: rgba(224, 4, 4, 0.35) !important;
  color: #ffffff !important;
}

/* ── NUCLEAR: catch absolutely any remaining white/light divs ─────────── */
div, section, article, main, aside, footer, header, nav, form,
fieldset, legend, details, summary, figure, figcaption {
  border-color: #21262d !important;
}

/* Tooltip */
.tooltip-inner {
  background-color: #1c2128 !important;
  color: #c9d1d9 !important;
  border: 1px solid #30363d !important;
}

.tooltip .arrow::before {
  border-color: #1c2128 !important;
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPLICIT CUIMS PORTAL CLASS OVERRIDES (Fixes all white card boxes & leakage)
   ══════════════════════════════════════════════════════════════════════════ */

/* Main layout wrappers */
.main-wrapper, .inner-wrapper, body, body.body-gradient, body.loaded, html {
  background-color: #0d1117 !important;
  background: #0d1117 !important;
  color: #c9d1d9 !important;
}

/* All Cards, Panels & Boxes (Dashboard Widgets & .box-shadow-common) */
.box-shadow-common,
.shortLinks__item a,
.uims-sidebar,
.user-profile-link,
.user-dropdown,
.setting-dropdown,
.NavigationSearchPC,
.page-search,
header,
.card, .panel, .panel-default, .panel-body, .box, .widget, .well {
  background-color: #161b22 !important;
  background: #161b22 !important;
  color: #c9d1d9 !important;
  border-color: #21262d !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
}

/* Force all child containers inside .box-shadow-common cards to dark */
.box-shadow-common div,
.box-shadow-common p,
.box-shadow-common section,
.box-shadow-common article,
.box-shadow-common .card-body,
.box-shadow-common .panel-body {
  background-color: transparent !important;
  background: transparent !important;
  color: #c9d1d9 !important;
}

/* Quick link top bar cards (Important Links, Student Facilitation, Anti Ragging, CU LMS, Email) */
.shortLinks__item a {
  background-color: #161b22 !important;
  background: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 8px !important;
}

.shortLinks__item a span {
  background-color: #21262d !important;
  background: #21262d !important;
  color: #58a6ff !important;
}

.shortLinks__item a h6 {
  color: #e6edf3 !important;
}

.shortLinks__item a small {
  color: #8b949e !important;
  border-bottom-color: #30363d !important;
}

/* Headers inside cards */
.form_header,
.box-shadow-common h3,
.box-shadow-common h4,
.box-shadow-common h5,
.box-shadow-common .card-title,
.box-shadow-common .panel-title {
  color: #e6edf3 !important;
}

/* Tables inside dashboard cards */
table, table#rAttachments, table.table {
  background-color: #161b22 !important;
  background: #161b22 !important;
  border-color: #21262d !important;
}

table th, .table th, table thead th {
  background-color: #1c2128 !important;
  background: #1c2128 !important;
  color: #8b949e !important;
  border-color: #30363d !important;
}

table td, .table td {
  background-color: transparent !important;
  color: #c9d1d9 !important;
  border-color: #21262d !important;
}

table tbody tr:nth-child(even), table tr:nth-child(even) {
  background-color: #1c2128 !important;
  background: #1c2128 !important;
}

/* Sidebar navigation */
.uims-sidebar {
  background-color: #0d1117 !important;
  background: #0d1117 !important;
  border-right-color: #21262d !important;
}

.uims-sidebar li a {
  color: #8b949e !important;
}

.uims-sidebar li a:hover,
li[aria-expanded="true"] a {
  background-color: #161b22 !important;
  background: #161b22 !important;
  color: #ffffff !important;
}

.uims-sidebar ul .sub-menu li a {
  color: #8b949e !important;
}

.uims-sidebar ul .sub-menu li a::before {
  background: #484f58 !important;
}

.user-profile-link {
  background-color: #161b22 !important;
  background: #161b22 !important;
}

.user-profile-link h6,
.user-n-mob h5 {
  color: #e6edf3 !important;
}

/* Header & Search */
header {
  background-color: #161b22 !important;
  background: #161b22 !important;
  border-bottom-color: #21262d !important;
}

.page-search-input input[type="text"] {
  background-color: #0d1117 !important;
  background: #0d1117 !important;
  color: #c9d1d9 !important;
  border-color: #30363d !important;
}

.user-dropdown, .setting-dropdown {
  background-color: #161b22 !important;
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
}

.user-dropdown ul li a, .setting-dropdown ul li a {
  color: #c9d1d9 !important;
}

.user-dropdown ul li a:hover, .setting-dropdown ul li a:hover {
  background-color: #21262d !important;
  background: #21262d !important;
  color: #ffffff !important;
}

/* Footer */
footer {
  background-color: #0d1117 !important;
  background: #0d1117 !important;
  border-top-color: #21262d !important;
  color: #8b949e !important;
}

/* ── Tab Controls (e.g., Apply Loan, Loan Status, DivUpdate) ─────────── */
[style*="background-color: lightgray"], [style*="background-color:lightgray"],
[style*="background-color: lightgrey"], [style*="background-color:lightgrey"],
[style*="background: lightgray"], [style*="background:lightgray"],
[style*="background: lightgrey"], [style*="background:lightgrey"],
div[id*="DivUpdate"], div[id*="DivApply"], #DivUpdate, #DivApply {
  background-color: #161b22 !important;
  background: #161b22 !important;
  color: #c9d1d9 !important;
  border-color: #21262d !important;
}

div[id*="DivUpdate"]:hover, div[id*="DivApply"]:hover, #DivUpdate:hover, #DivApply:hover {
  background-color: #1c2128 !important;
  background: #1c2128 !important;
  color: #ffffff !important;
}

/* Outer shortLinks wrappers should be transparent */
.shortLinks, #short_links, .shortLinks__item,
div[id*="div_top_"], #div_OE {
  background-color: transparent !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* ── Highcharts SVG Graphs & Rects ────────────────────────────────────── */
.highcharts-container, .highcharts-background, rect.highcharts-background,
.highcharts-plot-background, rect.highcharts-plot-background,
svg rect[fill="#ffffff"], svg rect[fill="#fff"], svg rect[fill="white"] {
  fill: #161b22 !important;
  background-color: #161b22 !important;
  background: #161b22 !important;
}

.highcharts-title, .highcharts-subtitle, .highcharts-axis-labels text,
.highcharts-legend-item text, .highcharts-data-label text, .highcharts-label text,
svg text {
  fill: #c9d1d9 !important;
  color: #c9d1d9 !important;
}

.highcharts-grid-line, .highcharts-axis-line, .highcharts-tick {
  stroke: #30363d !important;
}

.highcharts-legend-item:hover text {
  fill: #ffffff !important;
}

/* ── Page Loaders & Overlay Spinners ─────────────────────────────────── */
#loader-wrapper, #loader, .loader-wrapper, .loader,
[id*="loader"], [id*="Loader"], [class*="loader"],
[id*="loading"], [id*="Loading"], [class*="loading"],
.page-loader, .spinner-wrapper, .blockUI, .blockOverlay {
  background-color: #0d1117 !important;
  background: #0d1117 !important;
  color: #c9d1d9 !important;
}

#loader p, #loader-wrapper p, [id*="loader"] p, [id*="loader"] span,
[id*="loading"] p, [id*="loading"] span {
  color: #c9d1d9 !important;
}

#loader img, #loader-wrapper img, [id*="loader"] img {
  filter: brightness(0.9) contrast(1.2);
}

/* ── Select2 Dropdown Component (Selects, Search boxes, Options) ───────── */
#select2-drop, .select2-drop, .select2-drop-active, .select2-dropdown,
.select2-results, .select2-results li, .select2-container .select2-choice {
  background-color: #161b22 !important;
  background: #161b22 !important;
  color: #c9d1d9 !important;
  border-color: #30363d !important;
}

.select2-container .select2-choice {
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

.select2-container .select2-choice .select2-chosen,
.select2-result-label, .select2-match {
  color: #c9d1d9 !important;
}

.select2-search, .select2-search input, .select2-input {
  background-color: #0d1117 !important;
  background: #0d1117 !important;
  color: #c9d1d9 !important;
  border: 1px solid #30363d !important;
  border-radius: 4px !important;
}

.select2-results .select2-result-selectable {
  background-color: #161b22 !important;
  color: #c9d1d9 !important;
}

.select2-results .select2-highlighted,
.select2-results li:hover,
.select2-results .select2-result-selectable:hover {
  background-color: #21262d !important;
  background: #21262d !important;
  color: #ffffff !important;
}

.select2-results .select2-highlighted .select2-result-label {
  color: #ffffff !important;
}

/* ── University Email Popup Box (#divUniEmail) ────────────────────────── */
#divUniEmail, div[id*="divUniEmail"], div[id*="div_OE"] div {
  background-color: #1c2128 !important;
  background: #1c2128 !important;
  color: #c9d1d9 !important;
  border: 1px solid #30363d !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
}

#divUniEmail b, #divUniEmail span, #divUniEmail p, #divUniEmail a {
  color: #e6edf3 !important;
}

#divUniEmail a {
  color: #58a6ff !important;
}

/* ── Quick Link Card Icon Spans & Special Styling (.shortLinks__item a span, .CULMSStyle) ── */
.shortLinks__item a span,
.shortLinks__item a span[style*="background"] {
  background-color: #21262d !important;
  background: #21262d !important;
  border-radius: 6px !important;
}

.CULMSStyle, a.CULMSStyle {
  background-color: #161b22 !important;
  background: #161b22 !important;
  border: 1px solid #21262d !important;
}

.CULMSStyle h6, .CULMSStyle small {
  color: #e6edf3 !important;
}

.CULMSStyle span, .CULMSStyle span[style*="background"] {
  background-color: #21262d !important;
  background: #21262d !important;
}

/* ── NOC Application & Student Details (.nocRemarks, .nocDetails, etc.) ──── */
.nocRemarks, .nocRemarks1, [class*="nocRemarks"], [id*="nocRemarks"] {
  background-color: #1c2128 !important;
  background: #1c2128 !important;
  color: #c9d1d9 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  padding: 10px !important;
}

.nocRemarks ul, .nocRemarks1 ul, .nocRemarks li, .nocRemarks1 li,
.nocRemarks span, .nocRemarks1 span {
  background-color: transparent !important;
  background: transparent !important;
  color: #c9d1d9 !important;
}

.nocDetails, [class*="nocDetails"] {
  background-color: #161b22 !important;
  background: #161b22 !important;
  color: #c9d1d9 !important;
}

.nocDetails ul {
  background-color: #161b22 !important;
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 8px !important;
  padding: 12px !important;
  margin-bottom: 12px !important;
}

.nocDetails h6 {
  background-color: #1c2128 !important;
  background: #1c2128 !important;
  color: #58a6ff !important;
  border-radius: 4px !important;
  padding: 6px 10px !important;
  font-weight: 600 !important;
}

.nocDetails li {
  background-color: transparent !important;
  background: transparent !important;
  color: #8b949e !important;
  border-bottom: 1px solid #21262d !important;
}

.nocDetails li b {
  color: #c9d1d9 !important;
}

.nocDetails li span {
  background-color: transparent !important;
  background: transparent !important;
  color: #e6edf3 !important;
}

/* Highlighted rows like Company Name (aquamarine in CUIMS) */
[style*="background-color: aquamarine"], [style*="background-color:aquamarine"],
[style*="background: aquamarine"], [style*="background:aquamarine"],
li[style*="aquamarine"] {
  background-color: #1c2d42 !important;
  background: #1c2d42 !important;
  color: #79c0ff !important;
  border: 1px solid #1f6feb !important;
  border-radius: 4px !important;
}

li[style*="aquamarine"] b, li[style*="aquamarine"] span {
  color: #79c0ff !important;
}

/* Inner card borders & containers */
.placColoar_card--inner, [class*="placColoar"], [class*="hideborder"], .RemoveBorder {
  background-color: #161b22 !important;
  background: #161b22 !important;
  color: #c9d1d9 !important;
  border-color: #21262d !important;
}

[style*="border-color:White"], [style*="border-color: white"], [style*="border-color:#fff"] {
  border-color: #21262d !important;
}

[style*="border-right: 1px solid gainsboro"], [style*="border-left: 1px solid gainsboro"],
[style*="border-right:1px solid gainsboro"], [style*="border-left:1px solid gainsboro"],
[style*="border-right: 1px solid #"], [style*="border-left: 1px solid #"],
[style*="border-right:1px solid #"], [style*="border-left:1px solid #"] {
  border-color: #30363d !important;
}
`;

function applyDarkMode(enabled) {
  let styleEl = document.getElementById(DARK_MODE_STYLE_ID);
  if (enabled) {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = DARK_MODE_STYLE_ID;
    }
    styleEl.textContent = DARK_MODE_CSS;
    const parent = document.head || document.documentElement || document.body;
    if (parent && (!styleEl.parentNode || parent.lastChild !== styleEl)) {
      parent.appendChild(styleEl);
    }
  } else {
    if (styleEl) {
      styleEl.remove();
    }
  }
}

// Check and apply Dark Mode state immediately on load
chrome.storage.local.get(['darkModeEnabled'], (result) => {
  if (result.darkModeEnabled) {
    applyDarkMode(true);
  }
});

// Re-check when DOM is ready and when fully loaded
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['darkModeEnabled'], (result) => {
    if (result.darkModeEnabled) {
      applyDarkMode(true);
    }
  });
});

window.addEventListener('load', () => {
  chrome.storage.local.get(['darkModeEnabled'], (result) => {
    if (result.darkModeEnabled) {
      applyDarkMode(true);
    }
  });
});

// Listen for Dark Mode toggle changes from extension popup in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.darkModeEnabled !== undefined) {
    applyDarkMode(!!changes.darkModeEnabled.newValue);
  }
});

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
