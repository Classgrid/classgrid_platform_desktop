import mongoose from "mongoose";

const noteVersionSchema = new mongoose.Schema({
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true
    },
    textContent: {
        type: String,
    },
    tags: [{
        type: String,
    }],
    category: {
        type: String,
    },
    icon: {
        type: String,
    },
    status: {
        type: String,
    },
    visibility: {
        type: String,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

noteVersionSchema.index({ noteId: 1, createdAt: -1 });

export default mongoose.model("NoteVersion", noteVersionSchema);
