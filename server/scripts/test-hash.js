import crypto from "crypto";
const email = "classgrid26@gmail.com";
const hmac = crypto.createHmac("sha256", "classgrid_fallback").update(email).digest("hex").slice(0, 32);
console.log("HMAC:", hmac);

const md5 = crypto.createHash("md5").update(email).digest("hex");
console.log("MD5:", md5);
