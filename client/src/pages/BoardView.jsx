import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { io } from 'socket.io-client';
import List from '../components/List';
import TaskCard from '../components/TaskCard';
import {
    ChevronLeft, Search, Plus, Loader2, Users,
    Layout, History, MoreHorizontal, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BoardView = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [activeList, setActiveList] = useState(null);
    const [newListTitle, setNewListTitle] = useState('');
    const [activities, setActivities] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [presentUsers, setPresentUsers] = useState([]);
    const [showActivity, setShowActivity] = useState(false);

    const filteredTasks = tasks;
    /*
        const filteredTasks = tasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    */

    const [socket, setSocket] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const fetchBoard = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`http://localhost:5000/api/boards/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBoard(res.data);
                setLists(res.data.lists || []);
                setTasks(res.data.tasks || []);
                setActivities(res.data.activities || []);
            } catch (err) {
                console.error(err);
            }
        };

        const fetchUsers = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('http://localhost:5000/api/boards/users/all', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAllUsers(res.data);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        fetchBoard();
        fetchUsers();

        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        if (user) {
            newSocket.emit('join_board', { boardId: id, user: { _id: user._id, username: user.username } });
        }

        newSocket.on('presence_update', (users) => {
            setPresentUsers(users);
        });

        newSocket.on('list_created', (list) => setLists(prev => {
            if (prev.find(l => l._id === list._id)) return prev;
            return [...prev, list];
        }));
        newSocket.on('list_updated', (updatedList) => setLists(prev => prev.map(l => l._id === updatedList._id ? updatedList : l)));
        newSocket.on('list_deleted', (listId) => setLists(prev => prev.filter(l => l._id !== listId)));
        newSocket.on('task_created', (task) => setTasks(prev => {
            if (prev.find(t => t._id === task._id)) return prev;
            return [...prev, task];
        }));
        newSocket.on('task_updated', (updatedTask) => setTasks(prev => {
            const exists = prev.find(t => t._id === updatedTask._id);
            return exists ? prev.map(t => t._id === updatedTask._id ? updatedTask : t) : [...prev, updatedTask];
        }));
        newSocket.on('task_deleted', (taskId) => setTasks(prev => prev.filter(t => t._id !== taskId)));
        newSocket.on('activity_logged', (activity) => setActivities(prev => [activity, ...prev].slice(0, 50)));

        return () => newSocket.disconnect();
    }, [id]);

    const handleAddList = async (e) => {
        e.preventDefault();
        const title = newListTitle.trim();
        if (!title) return;

        console.log('Front-end: Adding list...', { title, boardId: id });
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://localhost:5000/api/lists', { title, boardId: id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Front-end: List created:', res.data);

            // Avoid duplicates if socket pulse also arrives
            setLists(prev => {
                if (prev.find(l => l._id === res.data._id)) return prev;
                return [...prev, res.data];
            });
            setNewListTitle('');
        } catch (err) {
            console.error('Front-end: Add list error:', err);
            alert('Failed to add column: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAddTask = async (listId, title) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://localhost:5000/api/tasks', { title, listId, boardId: id, priority: 'Medium' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(prev => {
                if (prev.find(t => t._id === res.data._id)) return prev;
                return [...prev, res.data];
            });
        } catch (err) { console.error(err); }
    };

    const handleAssignUser = async (taskId, userId) => {
        const token = localStorage.getItem('token');
        const task = tasks.find(t => t._id === taskId);
        if (!task) return;

        const isAssigned = task.assignees?.some(u => u._id === userId);
        const newAssignees = isAssigned
            ? task.assignees.filter(u => u._id !== userId).map(u => u._id)
            : [...(task.assignees || []).map(u => u._id), userId];

        try {
            const res = await axios.put(`http://localhost:5000/api/tasks/${taskId}`, {
                users: newAssignees
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state is handled by socket task_updated
        } catch (err) {
            console.error('Error assigning user:', err);
        }
    };


    const handleDeleteTask = async (taskId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(prev => prev.filter(t => t._id !== taskId));
        } catch (err) { console.error('Delete task error:', err); }
    };

    const onDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        if (active.data.current?.type === 'List') setActiveList(active.data.current.list);
        if (active.data.current?.type === 'Task') setActiveTask(active.data.current.task);
    };

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;
        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        if (!isActiveTask) return;
        if (isActiveTask && isOverTask) {
            setTasks((prev) => {
                const activeIndex = prev.findIndex((t) => t._id === activeId);
                const overIndex = prev.findIndex((t) => t._id === overId);
                if (prev[activeIndex].listId !== prev[overIndex].listId) {
                    const newTasks = [...prev];
                    newTasks[activeIndex] = { ...newTasks[activeIndex], listId: prev[overIndex].listId };
                    return arrayMove(newTasks, activeIndex, overIndex);
                }
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
        const isOverList = over.data.current?.type === 'List';
        if (isActiveTask && isOverList) {
            setTasks((prev) => {
                const activeIndex = prev.findIndex((t) => t._id === activeId);
                if (prev[activeIndex].listId === overId) return prev;
                const newTasks = [...prev];
                newTasks[activeIndex] = { ...newTasks[activeIndex], listId: overId };
                return arrayMove(newTasks, activeIndex, activeIndex);
            });
        }
    };

    const onDragEnd = async (event) => {
        setActiveId(null);
        setActiveTask(null);
        setActiveList(null);
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;
        const isActiveList = active.data.current?.type === 'List';
        const isActiveTask = active.data.current?.type === 'Task';
        if (isActiveList) {
            setLists((lists) => {
                const oldIndex = lists.findIndex((l) => l._id === activeId);
                const newIndex = lists.findIndex((l) => l._id === overId);
                return arrayMove(lists, oldIndex, newIndex);
            });
        }
        if (isActiveTask) {
            const activeIndex = tasks.findIndex((t) => t._id === activeId);
            if (activeIndex === -1) return;
            const task = tasks[activeIndex];
            const token = localStorage.getItem('token');
            // Persistence: We update the task's new list and position in the backend
            if (task && token) {
                await axios.put(`http://localhost:5000/api/tasks/${activeId}`, {
                    listId: task.listId,
                    position: activeIndex
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        }
    };

    const listsIds = useMemo(() => lists.map((list) => list._id), [lists]);

    if (!board) return (
        <div className="h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin text-brand-500 w-12 h-12 mb-4" />
            <p className="text-slate-400 font-medium">Loading Workspace...</p>
        </div>
    );

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <div className="h-screen flex flex-col bg-[#0f172a] text-slate-200 overflow-hidden">
                {/* Board Header */}
                <div className="bg-slate-900/60 backdrop-blur-md border-b border-white/5 px-6 py-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 z-50">
                    <div className="flex items-center space-x-6 w-full md:w-auto">
                        <Link to="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                            <ChevronLeft className="text-slate-400 group-hover:text-white" size={24} />
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="bg-brand-500/20 p-2 rounded-xl border border-brand-500/20">
                                <Layout className="text-brand-400 w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-white">{board.title}</h1>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Workspace ID: {board._id.slice(-6)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                        {/* Search removed from this page per user request */}
                        <div className="flex -space-x-2">
                            {presentUsers.map((u, i) => (
                                <div
                                    key={i}
                                    title={`${u.username} (Online)`}
                                    className="w-8 h-8 rounded-full border-2 border-slate-900 bg-brand-500 flex items-center justify-center text-[10px] font-black text-white hover:scale-110 transition-transform cursor-pointer uppercase shadow-lg shadow-brand-500/20"
                                >
                                    {u.username.charAt(0)}
                                </div>
                            ))}
                            <button className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-colors ml-2">
                                <Plus size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowActivity(!showActivity)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all ${showActivity ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-800/40 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <History size={16} />
                            <span className="text-xs font-bold">History</span>
                        </button>
                    </div>
                </div>

                {/* Board Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-[#0f172a]">
                    <div className="h-full flex p-8 space-x-6 items-start">
                        <SortableContext items={listsIds} strategy={horizontalListSortingStrategy}>
                            {lists.map((list) => (
                                <List
                                    key={list._id}
                                    list={list}
                                    tasks={filteredTasks.filter(t => t.listId === list._id)}
                                    onDeleteList={() => { }}
                                    onAddTask={handleAddTask}
                                    onDeleteTask={handleDeleteTask}
                                    onAssignUser={handleAssignUser}
                                    allUsers={allUsers}
                                />
                            ))}
                        </SortableContext>

                        {/* Add List Input Card */}
                        <div className="w-80 flex-shrink-0">
                            <form onSubmit={handleAddList} className="bg-slate-800/20 backdrop-blur-sm border-2 border-dashed border-white/5 rounded-2xl p-4 hover:border-brand-500/30 transition-all group">
                                <input
                                    type="text"
                                    placeholder="+ New list name"
                                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 font-bold px-0 mb-4"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                />
                                <button type="submit" className="w-full py-2 bg-slate-700 group-hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
                                    Add Column
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Activity Panel */}
                {showActivity && (
                    <div className="w-80 bg-slate-900 border-l border-white/5 flex flex-col z-40 animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-lg font-black text-white">Activity Feed</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activities.map((activity) => (
                                <div key={activity._id} className="flex space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-brand-400 flex-shrink-0 mt-1 uppercase">
                                        {activity.user?.username?.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-300">
                                            <span className="font-bold text-white">{activity.user?.username}</span> {activity.content}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Drag Overlays */}
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeId ? (
                    activeList ? (
                        <div className="bg-slate-800 w-80 rounded-2xl p-4 h-[120px] opacity-80 border-2 border-brand-500 shadow-2xl shadow-brand-500/20">
                            <h3 className="font-black text-white">{activeList.title}</h3>
                        </div>
                    ) : (
                        <div className="bg-slate-800/90 p-4 rounded-xl shadow-2xl opacity-90 rotate-3 border-2 border-brand-500 w-[280px]">
                            <p className="text-white font-bold">{activeTask?.title}</p>
                        </div>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default BoardView;
