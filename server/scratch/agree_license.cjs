require('dotenv').config();
const cfToken = process.env.CLOUDFLARE_WORKERS_AI_TOKEN;
const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${cfToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: 'agree' })
})
.then(res => res.text())
.then(text => console.log('Meta License Agreement Response:', text))
.catch(err => console.error('Error:', err));
