/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function start() {
    try {
        const { getChatSb } = await import("./config/supabaseClient.js");
        const sb = getChatSb();
        
        console.log("Connected to Supabase for Chat Bridge (No MongoDB needed).");
        console.log("Waiting for ANY new messages on the platform to auto-detect your chat...");

        let lastCheckedAt = new Date().toISOString();
        let myMockId = "66f7f0b9f0b9f0b9f0b9f0b9"; // Fallback ID if we can't find one
        let activeTargetId = null;
        let activeOrgId = null;

        setInterval(async () => {
            const { data: msgs, error } = await sb
                .from('org_direct_messages')
                .select('*')
                .gt('created_at', lastCheckedAt)
                .order('created_at', { ascending: true });

            if (!error && msgs && msgs.length > 0) {
                for (const msg of msgs) {
                    console.log(`\n[INCOMING] ${msg.sender_name}: ${msg.message}`);
                    activeTargetId = msg.sender_id; // The person who sent the message (Super Admin)
                    myMockId = msg.receiver_id;     // The person they sent it to (Us)
                    activeOrgId = msg.org_id;
                    lastCheckedAt = msg.created_at;
                }
            }
        }, 2000);

        rl.on("line", async (input) => {
            if (!activeTargetId) {
                console.log("Wait for the Super Admin to send a message first!");
                return;
            }

            try {
                const msgData = {
                    sender_id: myMockId,
                    sender_name: "Neha Sharma",
                    user_avatar: "",
                    receiver_id: activeTargetId,
                    message: input.trim(),
                    org_id: activeOrgId,
                    created_at: new Date().toISOString()
                };

                const { error } = await sb.from('org_direct_messages').insert([msgData]);
                if (error) throw error;
                console.log(`[SENT to ${activeTargetId}]: ${input}`);
            } catch (err) {
                console.error("Failed to send message:", err.message);
            }
        });

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

start();
