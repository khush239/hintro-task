const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['task_created', 'task_updated', 'task_deleted', 'task_moved', 'member_assigned', 'list_created', 'list_updated', 'list_deleted']
    },
    content: {
        type: String,
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', ActivitySchema);
