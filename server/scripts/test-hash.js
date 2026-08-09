import crypto from "crypto";

function generateUnsubscribeHash(email) {
  const secret = "classgrid_fallback";
  return crypto.createHmac("sha256", secret).update(email).digest("hex").slice(0, 32);
}

const originalEmail = "gorekrushna82@gmail.com";
const hash = generateUnsubscribeHash(originalEmail);

const url = `http://localhost:3000/api/blog/unsubscribe?email=${encodeURIComponent(originalEmail)}&token=${hash}`;
const parsedUrl = new URL(url);
const extractedEmail = parsedUrl.searchParams.get("email");
const extractedToken = parsedUrl.searchParams.get("token");

console.log("Original Email: ", originalEmail);
console.log("Extracted Email: ", extractedEmail);
console.log("Original Hash:  ", hash);
console.log("Extracted Token:", extractedToken);
console.log("Validation:     ", generateUnsubscribeHash(extractedEmail) === extractedToken);

