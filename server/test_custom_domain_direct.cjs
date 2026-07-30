const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const { notifyExternalDomainChange, notifyDomainChange } = await import("./src/services/domain-change-email.service.js");

        console.log("Sending Custom Domain Email (Verified) directly to AWS SES...");
        await notifyExternalDomainChange({
            action: 'verified',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: 'nikhilsubsun321@gmail.com',
            newDomain: 'google.com',
            oldDomain: 'google.com',
            newSettings: { is_enabled: true, allow_classgrid_url: false },
            oldSettings: { is_enabled: false, allow_classgrid_url: true }
        });

        console.log("Successfully sent via Direct AWS SES!");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
