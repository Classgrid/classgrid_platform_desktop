import mongoose from "mongoose";
import dotenv from "dotenv";
import GlobalAiConfig from "./src/models/GlobalAiConfig.js";

dotenv.config({ path: "./.env" });

async function resetGlobalConfig() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const config = await GlobalAiConfig.findOneAndUpdate(
            { key: "singleton" },
            {
                $set: {
                    global_user_weekly_limit: 0,
                    global_pro_pool_limit: 0,
                    global_image_weekly_limit: 0,
                    global_whatsapp_scheduling_limit: 0
                }
            },
            { returnDocument: 'after', upsert: true }
        );

        console.log("Reset global AI fallback limits to 0:");
        console.log("global_user_weekly_limit:", config.global_user_weekly_limit);
        console.log("global_pro_pool_limit:", config.global_pro_pool_limit);
        console.log("global_image_weekly_limit:", config.global_image_weekly_limit);
        console.log("global_whatsapp_scheduling_limit:", config.global_whatsapp_scheduling_limit);

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

resetGlobalConfig();
