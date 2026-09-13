export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Please POST an ID card image", { status: 400 });
    }

    try {
      // 1. Grab raw binary image array buffer from incoming request
      const imageBuffer = await request.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);

      // 2. Call Cloudflare's serverless vision model with a structured instruction
      const response = await env.AI.run("@cf/moondream/moondream3.1-9b-a2b", {
        image: [...imageBytes], // Model accepts byte array
        prompt: "Perform OCR on this identity card. Extract the Full Name, ID Number, Nationality, and Expiration Date into a clean JSON structure.",
        max_tokens: 512
      });

      // 3. Return parsed OCR data right back to your backend workflow
      return new Response(JSON.stringify({ success: true, data: response }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
