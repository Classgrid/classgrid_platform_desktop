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
        const { notifyExternalDomainChange } = await import("./src/services/domain-change-email.service.js");
        const emailAddress = "nikhilsubsun321@gmail.com";

        console.log("Sending Email 1 (Registered)...");
        await notifyExternalDomainChange({
            action: 'registered',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: emailAddress,
            newDomain: 'erp.quantumchem.site',
            oldDomain: null
        });

        console.log("Sending Email 2 (Changed)...");
        await notifyExternalDomainChange({
            action: 'changed',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: emailAddress,
            newDomain: 'erp.quantumchem.site',
            oldDomain: 'old.quantumchem.site'
        });

        console.log("Sending Email 3 (Verified)...");
        await notifyExternalDomainChange({
            action: 'verified',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: emailAddress,
            newDomain: 'erp.quantumchem.site',
            oldDomain: 'erp.quantumchem.site'
        });

        console.log("Sending Email 4 (Settings Updated)...");
        await notifyExternalDomainChange({
            action: 'settings_updated',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: emailAddress,
            newDomain: 'erp.quantumchem.site',
            newSettings: { is_enabled: false },
            oldSettings: { is_enabled: true }
        });

        console.log("Sending Email 5 (Removed)...");
        await notifyExternalDomainChange({
            action: 'removed',
            domainType: 'erp_domain',
            orgName: 'QuantumChem',
            adminName: 'Neha Sharma',
            adminEmail: emailAddress,
            newDomain: 'erp.quantumchem.site'
        });

        console.log("✅ ALL 5 EMAILS SUCCESSFULLY SENT!");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
