import dotenv from 'dotenv';
dotenv.config();
import { notifyExternalDomainChange } from './src/services/domain-change-email.service.js';

const emailAddress = "nikhilsubsun321@gmail.com";

const basePayload = {
    to: emailAddress,
    orgName: "Classgrid University",
    adminName: "Nikhil",
    adminEmail: emailAddress,
    domainType: "erp_domain",
    oldDomain: "erp.classgrid.edu",
    oldSettings: { is_enabled: false, allow_classgrid_url: true },
    newSettings: { is_enabled: true, allow_classgrid_url: false },
    organizationId: "12345",
    userId: "user_67890",
    subdomain: "classgrid-university",
};

const actions = ["registered", "changed", "verified", "settings_updated", "removed"];

async function runBulkTests() {
    console.log(`Starting to send all ${actions.length} Domain Status emails to ${emailAddress}...`);
    
    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        try {
            console.log(`\n[${i+1}/${actions.length}] Sending '${action}' email...`);
            await notifyExternalDomainChange({
                ...basePayload,
                action: action,
            });
            console.log(`✅ Success for action: ${action}`);
            
            // Wait 2 seconds to prevent AWS rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Error sending '${action}':`, error);
        }
    }
    
    console.log(`\n🎉 Finished sending all domain registry emails!`);
    process.exit(0);
}

runBulkTests();
