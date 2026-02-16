const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const logActivity = require('../utils/activityLogger');

// @desc    Create a list
// @route   POST /api/lists
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title, boardId } = req.body;
    console.log('Creating list request:', { title, boardId });
    try {
        const count = await List.countDocuments({ boardId });
        console.log('Current list count:', count);
        const list = await List.create({
            title,
            boardId,
            position: count
        });
        console.log('List created:', list._id);

        const io = req.app.get('socketio');
        io.to(boardId).emit('list_created', list);
        console.log('Socket event emitted to board:', boardId);

        await logActivity(io, {
            user: req.user.id,
            boardId,
            type: 'list_created',
            content: `added column "${title}"`
        });

        res.status(201).json(list);
    } catch (error) {
        console.error('List creation error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const list = await List.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });

        if (req.body.title) list.title = req.body.title;
        if (req.body.position !== undefined) list.position = req.body.position;

        await list.save();

        const io = req.app.get('socketio');
        io.to(list.boardId.toString()).emit('list_updated', list);

        await logActivity(io, {
            user: req.user.id,
            boardId: list.boardId,
            type: 'list_updated',
            content: `renamed column to "${list.title}"`
        });

        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const list = await List.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });

        const boardId = list.boardId;
        await list.deleteOne();
        await Task.deleteMany({ listId: req.params.id });

        const io = req.app.get('socketio');
        io.to(boardId.toString()).emit('list_deleted', req.params.id);

        await logActivity(io, {
            user: req.user.id,
            boardId,
            type: 'list_deleted',
            content: `removed column "${list.title}"`
        });

        res.json({ message: 'List removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
