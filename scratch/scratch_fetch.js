/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
const url = 'https://attendanceqrble.web.app/?t=8ca13c27c02250d6';
fetch(url).then(res => res.text()).then(text => {
  const start = text.indexOf('<script type="module">');
  console.log(text.substring(start));
}).catch(console.error);
