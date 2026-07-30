import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const { notifyExternalDomainChange, notifyDomainChange } = await import("./src/services/domain-change-email.service.js");
        const emailAddress = "nikhilsubsun321@gmail.com";

        console.log("Sending Email 1 (Verified)...");
        await notifyExternalDomainChange({
            action: 'verified',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: emailAddress,
            newDomain: 'erp.quantumchem.site',
            oldDomain: 'erp.quantumchem.site',
            newSettings: { is_enabled: true, allow_classgrid_url: false },
            oldSettings: { is_enabled: false, allow_classgrid_url: true }
        });

        console.log("Sending Email 2 (Changed)...");
        // Using notifyDomainChange for internal domains
        await notifyDomainChange({
            action: 'changed',
            domainType: 'org_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: emailAddress,
            newDomain: 'qchem',
            oldDomain: 'quantum',
            newSettings: null,
            oldSettings: null
        });

        console.log("✅ BOTH EMAILS SUCCESSFULLY SENT VIA AWS SES!");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
