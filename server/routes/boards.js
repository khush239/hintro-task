const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get all boards
// @route   GET /api/boards
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [{ user: req.user.id }, { members: req.user.id }]
        });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a board
// @route   POST /api/boards
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title } = req.body;
    try {
        const board = new Board({
            title,
            user: req.user.id,
            members: [req.user.id] // Owner is also a member
        });
        const createdBoard = await board.save();
        res.status(201).json(createdBoard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all users (for assignment)
// @route   GET /api/boards/users/all
// @access  Private
router.get('/users/all', protect, async (req, res) => {
    try {
        const users = await User.find().select('username email');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get single board by ID
// @route   GET /api/boards/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Allow owner or members to view
        if (board.user.toString() !== req.user.id && !board.members.includes(req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Fetch lists, tasks, and activities for this board
        const lists = await List.find({ boardId: req.params.id }).sort('position');
        const tasks = await Task.find({ boardId: req.params.id }).sort('position').populate('assignees', 'username');
        const activities = await Activity.find({ boardId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'username');

        res.json({ ...board.toObject(), lists, tasks, activities });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        if (board.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        board.title = req.body.title || board.title;
        // Logic for adding members could go here

        const updatedBoard = await board.save();
        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        if (board.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await board.deleteOne();
        await List.deleteMany({ boardId: req.params.id });
        await Task.deleteMany({ boardId: req.params.id });

        res.json({ message: 'Board removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
