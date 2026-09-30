import fetch from 'node-fetch';

async function testChat() {
  const payload = {
    message: "List all Organization Admins with their names and emails. Generate a beautiful PDF report of this list, email the PDF to me, and provide the final CDN download link right here in the chat.",
    history: [],
    userName: "Admin",
    userEmail: "admin@classgrid.in",
    userRole: "super_admin"
  };

  try {
    const res = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

testChat();
