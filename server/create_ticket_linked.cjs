const mongoose = require('mongoose');

async function createTicketLinked() {
    try {
        await mongoose.connect('mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid');
        
        const User = (await import('./src/models/User.js')).default;
        const SupportTicket = (await import('./src/models/SupportTicket.js')).default;
        
        // Find Neha Sharma in the database
        const nehaUser = await User.findOne({ name: { $regex: /neha shar/i } });
        
        if (!nehaUser) {
            console.log("Could not find a user named Neha Sharma in the database!");
            process.exit(1);
        }
        
        console.log("Found User:", nehaUser.name, "ID:", nehaUser._id, "Role:", nehaUser.role);
        
        const ticket = new SupportTicket({
            subject: "Help needed with admin features",
            message: "I am having trouble accessing some of my admin dashboard features.",
            category: "general",
            priority: "high",
            status: "open",
            submittedBy: nehaUser._id, // Link to the actual account
            submitterName: nehaUser.name,
            submitterEmail: nehaUser.email,
            submitterRole: nehaUser.role || "admin",
            organization_id: nehaUser.organization_id || null
        });
        
        await ticket.save();
        console.log("Successfully created linked ticket for", nehaUser.name);
        console.log("Ticket ID:", ticket._id.toString());

    } catch (e) {
        console.error("Error creating ticket:", e);
    } finally {
        process.exit(0);
    }
}

createTicketLinked();
