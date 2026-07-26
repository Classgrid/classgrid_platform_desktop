import Note from "../models/Note.js";

// Utility for formatting error responses
function buildErrorResponse(req, message) {
    const traceId = typeof req?.traceId === "string" ? req.traceId.trim() : "";
    const requestId = /^[A-Za-z0-9._:-]{1,128}$/.test(traceId) ? traceId : "";
    return {
        success: false,
        message,
        ...(requestId ? { requestId } : {}),
    };
}

export const getNotes = async (req, res) => {
    try {
        const { date, tag, search } = req.query;
        let query = { createdBy: req.user._id };

        // Filter by specific date
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Filter by tag
        if (tag) {
            query.tags = tag;
        }

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        const notes = await Note.find(query)
            .sort({ isPinned: -1, createdAt: -1 })
            .lean();

        res.json({
            success: true,
            notes
        });
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json(buildErrorResponse(req, "Failed to fetch notes."));
    }
};

export const createNote = async (req, res) => {
    try {
        const { title, content, tags, isPinned } = req.body;

        if (!title || !content) {
            return res.status(400).json(buildErrorResponse(req, "Title and content are required."));
        }

        // Strip HTML tags for text search indexing
        const textContent = content.replace(/<[^>]*>?/gm, '');

        const newNote = await Note.create({
            title,
            content,
            textContent,
            tags: Array.isArray(tags) ? tags : [],
            isPinned: !!isPinned,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            note: newNote
        });
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json(buildErrorResponse(req, "Failed to create note."));
    }
};

export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags, isPinned } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) {
            updateData.content = content;
            updateData.textContent = content.replace(/<[^>]*>?/gm, '');
        }
        if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
        if (isPinned !== undefined) updateData.isPinned = !!isPinned;

        const updatedNote = await Note.findOneAndUpdate(
            { _id: id, createdBy: req.user._id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedNote) {
            return res.status(404).json(buildErrorResponse(req, "Note not found."));
        }

        res.json({
            success: true,
            note: updatedNote
        });
    } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json(buildErrorResponse(req, "Failed to update note."));
    }
};

export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedNote = await Note.findOneAndDelete({
            _id: id,
            createdBy: req.user._id
        });

        if (!deletedNote) {
            return res.status(404).json(buildErrorResponse(req, "Note not found."));
        }

        res.json({
            success: true,
            message: "Note deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json(buildErrorResponse(req, "Failed to delete note."));
    }
};

export const togglePin = async (req, res) => {
    try {
        const { id } = req.params;
        
        const note = await Note.findOne({ _id: id, createdBy: req.user._id });
        if (!note) {
            return res.status(404).json(buildErrorResponse(req, "Note not found."));
        }

        note.isPinned = !note.isPinned;
        await note.save();

        res.json({
            success: true,
            note
        });
    } catch (error) {
        console.error("Error toggling pin status:", error);
        res.status(500).json(buildErrorResponse(req, "Failed to toggle pin status."));
    }
};
