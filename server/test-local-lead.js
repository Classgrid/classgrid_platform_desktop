import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://classgrid:UeE6B0K8R5b5WwG8@cluster0.e6t1l.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Cluster0");
        console.log("Connected to MongoDB.");

        const DemoRequest = (await import("./server/src/models/DemoRequest.js")).default;
        
        // Find latest demo lead
        const lead = await DemoRequest.findOne().sort({ createdAt: -1 });
        if (!lead) {
            console.log("No leads found.");
            process.exit(0);
        }

        console.log("Latest lead status:", lead.status, "meetingStatus:", lead.meetingStatus, "assignedTo:", lead.assignedTo);
        
        // Simulate assign
        lead.assignedTo = new mongoose.Types.ObjectId();
        if (lead.status === "new" || lead.status === "pending") {
            lead.status = "contacted";
        }
        await lead.save();
        console.log("After assign - status:", lead.status, "assignedTo:", lead.assignedTo);

        // Simulate reschedule
        lead.meetingStatus = "rescheduled";
        lead.assignedTo = null;
        await lead.save();
        console.log("After reschedule - meetingStatus:", lead.meetingStatus, "assignedTo:", lead.assignedTo);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
