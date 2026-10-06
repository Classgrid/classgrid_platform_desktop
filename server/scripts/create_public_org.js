import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../src/models/Organization.js';

dotenv.config();

async function createPublicOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const orgName = "Classgrid AI Public";
        
        let org = await Organization.findOne({ name: orgName });
        
        if (!org) {
            org = new Organization({
                name: orgName,
                sidebar_name: "Classgrid AI",
                org_type: "other",
                structure_type: "custom",
                private_code: "CLASSGRID_PUBLIC_CHAT_" + Date.now(),
                organizationCode: "CGPUBLIC",
                address: "Global",
                city: "Global",
                state: "Global",
                status: "active",
                org_mode: "production",
                branding: {
                    theme_colors: {
                        primary: "#6366f1",
                        secondary: "#4f46e5",
                        accent: "#f43f5e"
                    }
                },
                feature_flags: {
                    ai_assistant: true,
                    dashboard_student: true
                },
                ai_config: {
                    custom_limits_enabled: false,
                    is_ai_blocked: false,
                    pro_enabled_roles: ["student"]
                }
            });
            await org.save();
            console.log("Created Master Organization for Public Chat.");
        } else {
            console.log("Master Organization already exists.");
        }

        console.log("-----------------------------------------");
        console.log(`ORGANIZATION ID: ${org._id}`);
        console.log("-----------------------------------------");
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

createPublicOrg();
