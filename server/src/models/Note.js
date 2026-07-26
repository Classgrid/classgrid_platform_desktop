import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    textContent: {
        type: String, // Plain text content for easier searching
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: String,
        default: "General",
        trim: true
    },
    icon: {
        type: String,
        default: "📄"
    },
    status: {
        type: String,
        enum: ["Draft", "Published", "Archived", "Deprecated"],
        default: "Published"
    },
    visibility: {
        type: String,
        enum: ["Private", "Public", "Shared"],
        default: "Private"
    }
}, { timestamps: true });

// Indexes for faster search and filtering
noteSchema.index({ createdBy: 1, createdAt: -1 });
noteSchema.index({ createdBy: 1, tags: 1 });
noteSchema.index({ title: "text", textContent: "text", tags: "text" }); // Text index for full-text search

export default mongoose.model("Note", noteSchema);
