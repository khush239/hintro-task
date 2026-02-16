const Activity = require('../models/Activity');

const logActivity = async (io, { user, boardId, type, content, task }) => {
    try {
        const activity = new Activity({
            user,
            boardId,
            type,
            content,
            task
        });
        await activity.save();

        // Populate user for the real-time update
        const populatedActivity = await Activity.findById(activity._id).populate('user', 'username');

        // Emit real-time update to the board room
        if (io) {
            io.to(boardId.toString()).emit('activity_logged', populatedActivity);
        }

        return populatedActivity;
    } catch (err) {
        console.error('Error logging activity:', err);
    }
};

module.exports = logActivity;
