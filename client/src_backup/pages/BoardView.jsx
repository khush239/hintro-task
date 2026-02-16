import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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

const BoardView = () => {
    const { id } = useParams();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [activeList, setActiveList] = useState(null);
    const [newListTitle, setNewListTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter tasks based on search query
    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Socket state
    const [socket, setSocket] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // 10px movement to start drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchBoard = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`http://localhost:5000/api/boards/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBoard(res.data);
                setLists(res.data.lists);
                setTasks(res.data.tasks);
            } catch (err) {
                console.error(err);
            }
        };
        fetchBoard();

        // Socket connection
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.emit('join_board', id);

        newSocket.on('list_created', (list) => {
            setLists(prev => [...prev, list]);
        });

        newSocket.on('list_updated', (updatedList) => {
            setLists(prev => prev.map(l => l._id === updatedList._id ? updatedList : l));
        });

        newSocket.on('list_deleted', (listId) => {
            setLists(prev => prev.filter(l => l._id !== listId));
        });

        newSocket.on('task_created', (task) => {
            setTasks(prev => [...prev, task]);
        });

        newSocket.on('task_updated', (updatedTask) => {
            setTasks(prev => {
                // If moved to another board/list not tracked here? No, we filter by boardId usually.
                // But simplified: just replace/add
                const exists = prev.find(t => t._id === updatedTask._id);
                if (exists) {
                    return prev.map(t => t._id === updatedTask._id ? updatedTask : t);
                } else {
                    return [...prev, updatedTask];
                }
            });
        });

        newSocket.on('task_deleted', (taskId) => {
            setTasks(prev => prev.filter(t => t._id !== taskId));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [id]);

    const handleAddList = async (e) => {
        e.preventDefault();
        if (!newListTitle) return;
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://localhost:5000/api/lists', {
                title: newListTitle,
                boardId: id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Socket will update UI, but for immediate feedback we can add it? 
            // Better to wait for socket or add optimistically.
            // Since we emit socket on server, let's wait or add to state if socket latency is issue.
            setLists([...lists, res.data]);
            setNewListTitle('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTask = async (listId, title) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://localhost:5000/api/tasks', {
                title,
                listId,
                boardId: id,
                priority: 'Medium'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks([...tasks, res.data]);
        } catch (err) {
            console.error(err);
        }
    };

    const onDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        if (active.data.current?.type === 'List') {
            setActiveList(active.data.current.list);
            return;
        }

        if (active.data.current?.type === 'Task') {
            setActiveTask(active.data.current.task);
            return;
        }
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

        // Im dropping a Task over another Task
        if (isActiveTask && isOverTask) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t._id === activeId);
                const overIndex = tasks.findIndex((t) => t._id === overId);

                if (tasks[activeIndex].listId !== tasks[overIndex].listId) {
                    tasks[activeIndex].listId = tasks[overIndex].listId;
                    return arrayMove(tasks, activeIndex, overIndex - 1); // visually move to target list
                }

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        const isOverList = over.data.current?.type === 'List';

        // Im dropping a Task over a List
        if (isActiveTask && isOverList) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t._id === activeId);
                tasks[activeIndex].listId = overId; // Update listId to new list
                return arrayMove(tasks, activeIndex, activeIndex);
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
        if (isActiveList) {
            setLists((lists) => {
                const oldIndex = lists.findIndex((l) => l._id === activeId);
                const newIndex = lists.findIndex((l) => l._id === overId);
                return arrayMove(lists, oldIndex, newIndex);
            });
            // Update List Position API TODO (Not critical for prototype if tasks work)
        }

        const isActiveTask = active.data.current?.type === 'Task';
        if (isActiveTask) {
            // Finalize task move
            const activeIndex = tasks.findIndex((t) => t._id === activeId);
            const task = tasks[activeIndex];

            // Check if it really changed list or position
            // API Call to update task
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/tasks/${activeId}`, {
                listId: task.listId,
                position: activeIndex // Simplified position logic for now
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    };

    const listsIds = useMemo(() => lists.map((list) => list._id), [lists]);

    if (!board) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="h-screen flex flex-col bg-brand-50">
                <div className="bg-white shadow px-4 py-3 flex justify-between items-center z-10">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold text-gray-800">{board.title}</h1>
                        <span className="text-sm text-gray-500">Board ID: {board._id}</span>
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="h-full flex p-4 space-x-4">
                        <SortableContext items={listsIds} strategy={horizontalListSortingStrategy}>
                            {lists.map((list) => (
                                <List
                                    key={list._id}
                                    list={list}
                                    tasks={filteredTasks.filter(t => t.listId === list._id)}
                                    onDeleteList={() => { }} // TODO
                                    onAddTask={handleAddTask}
                                    onDeleteTask={(taskId) => {
                                        // API call to delete logic
                                    }}
                                />
                            ))}
                        </SortableContext>

                        <div className="w-80 flex-shrink-0">
                            <form onSubmit={handleAddList} className="bg-white rounded p-3 shadow-sm hover:shadow-md transition-shadow">
                                <input
                                    type="text"
                                    placeholder="+ Add another list"
                                    className="w-full px-2 py-1 mb-2 border rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                />
                                <button type="submit" className="w-full py-1 bg-brand-600 text-white rounded hover:bg-brand-700">Add List</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Overlay for smooth visual */}
            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.5',
                        },
                    },
                }),
            }}>
                {activeId ? (
                    activeList ? (
                        <div className="bg-gray-100 w-80 rounded-lg p-3 h-[150px] opacity-80 border-2 border-brand-500">
                            <h3 className="font-semibold">{activeList.title}</h3>
                        </div>
                    ) : (
                        <div className="bg-white p-3 rounded shadow opacity-90 rotate-3 border border-brand-500 w-[280px]">
                            {activeTask?.title}
                        </div>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default BoardView;
