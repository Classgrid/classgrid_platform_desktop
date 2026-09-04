import { getConsolidatedApprovalEmailPlainText, getConsolidatedApprovalEmailHtml } from "./server/src/services/email-templates.service.js";

const plainText = getConsolidatedApprovalEmailPlainText({
  adminName: "John Doe",
  orgName: "Global Tech Institute",
  subdomain: "gti",
  activationLink: "https://onboard.classgrid.in/?token=abcdef123456",
  activationCode: "492015",
  activationDate: new Date(),
  expiryDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
  sandboxDuration: 31,
  allocatedDashboards: ["dashboard_admission", "dashboard_faculty", "dashboard_student"]
});

console.log("=== PLAIN TEXT ===");
console.log(plainText);

const htmlText = getConsolidatedApprovalEmailHtml({
  adminName: "John Doe",
  orgName: "Global Tech Institute",
  subdomain: "gti",
  activationLink: "https://onboard.classgrid.in/?token=abcdef123456",
  activationCode: "492015",
  activationDate: new Date(),
  expiryDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
  sandboxDuration: 31,
  allocatedDashboards: ["dashboard_admission", "dashboard_faculty", "dashboard_student"]
});

console.log("\n=== HTML CONTENT ===");
console.log(htmlText);
