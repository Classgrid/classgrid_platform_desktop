const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const EmailJob = (await import("./src/models/EmailJob.js")).default;
        const { notifyExternalDomainChange, notifyDomainChange } = await import("./src/services/domain-change-email.service.js");
        const { processEmailQueue } = await import("./src/services/email-queue.service.js");

        console.log("Deleting old email jobs to prevent duplicates...");
        await EmailJob.deleteMany({});
        console.log("Cleared old email queue.");

        console.log("Sending Custom Domain Email (Verified)...");
        await notifyExternalDomainChange({
            action: 'verified',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: 'nikhilsubsun123@gmail.com',
            newDomain: 'erp.quantumchem.site',
            oldDomain: 'erp.quantumchem.site',
            newSettings: { is_enabled: true, allow_classgrid_url: false },
            oldSettings: { is_enabled: false, allow_classgrid_url: true }
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("Sending Default URL Change Email...");
        await notifyDomainChange({
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: 'nikhilsubsun123@gmail.com',
            oldDomain: 'quantumchem',
            newDomain: 'quantumchem-new'
        });

        console.log("Successfully queued both emails.");

        console.log("Flushing queue through AWS SES...");
        await processEmailQueue(10);
        console.log("Queue processed.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
