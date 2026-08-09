import crypto from "crypto";

const email = "gorekrushna82@gmail.com";
const secret = "classgrid_blog_webhook_2024_secret";

const hmac = crypto.createHmac("sha256", secret).update(email).digest("hex").slice(0, 32);
const md5 = crypto.createHash("md5").update(email).digest("hex");
const fallback = crypto.createHmac("sha256", "classgrid_fallback").update(email).digest("hex").slice(0, 32);

console.log("Token from URL:", "6b0b0ebf73cb3fa918c92e077716b4ac");
console.log("HMAC with new secret:", hmac);
console.log("MD5:", md5);
console.log("Fallback:", fallback);
