const axios = require('axios');
require('dotenv').config();

async function testVision() {
  try {
    const url = \`https://api.cloudflare.com/client/v4/accounts/\${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct\`;
    const res = await axios.post(url, {
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': \`Bearer \${process.env.CLOUDFLARE_WORKERS_AI_TOKEN}\`,
        'Content-Type': 'application/json'
      }
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.log("ERROR:", err.response ? err.response.data : err.message);
  }
}
testVision();
