const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const logActivity = require('../utils/activityLogger');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title, description, listId, boardId, priority, dueDate } = req.body;
    try {
        const count = await Task.countDocuments({ listId });
        const task = await Task.create({
            title,
            description,
            listId,
            boardId,
            priority,
            dueDate,
            position: count
        });

        const io = req.app.get('socketio');
        io.to(boardId).emit('task_created', task);

        await logActivity(io, {
            user: req.user.id,
            boardId,
            type: 'task_created',
            content: `created task "${title}"`,
            task: task._id
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update task (and move between lists)
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const { title, description, priority, users, listId, position } = req.body;

        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority) task.priority = priority;
        if (users) task.assignees = users;

        let moveEvent = false;
        if (listId && listId !== task.listId.toString()) {
            task.listId = listId;
            moveEvent = true;
        }
        if (position !== undefined) {
            task.position = position;
            moveEvent = true;
        }

        await task.save();
        await task.populate('assignees', 'username');

        const io = req.app.get('socketio');
        io.to(task.boardId.toString()).emit('task_updated', task);

        if (moveEvent) {
            await logActivity(io, {
                user: req.user.id,
                boardId: task.boardId,
                type: 'task_moved',
                content: `moved task "${task.title}"`,
                task: task._id
            });
        } else if (users) {
            await logActivity(io, {
                user: req.user.id,
                boardId: task.boardId,
                type: 'member_assigned',
                content: `updated assignees for "${task.title}"`,
                task: task._id
            });
        } else {
            await logActivity(io, {
                user: req.user.id,
                boardId: task.boardId,
                type: 'task_updated',
                content: `updated task "${task.title}"`,
                task: task._id
            });
        }

        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const boardId = task.boardId;
        await task.deleteOne();

        const io = req.app.get('socketio');
        io.to(boardId.toString()).emit('task_deleted', req.params.id);

        await logActivity(io, {
            user: req.user.id,
            boardId,
            type: 'task_deleted',
            content: `deleted task "${task.title}"`
        });

        res.json({ message: 'Task removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
