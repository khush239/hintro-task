import { Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import { useState } from 'react';

const List = ({ list, tasks, onDeleteList, onAddTask, onDeleteTask, onAssignUser, allUsers }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: list._id, data: { type: 'List', list } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        onAddTask(list._id, newTaskTitle);
        setNewTaskTitle('');
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-slate-900/40 border border-white/5 w-80 flex-shrink-0 rounded-3xl p-5 flex flex-col max-h-full backdrop-blur-sm shadow-xl"
        >
            <div
                {...attributes}
                {...listeners}
                className="flex justify-between items-center mb-6 cursor-grab active:cursor-grabbing group/header"
            >
                <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-white text-lg tracking-tight">{list.title}</h3>
                    <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded-full font-bold">
                        {tasks.length}
                    </span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                        <MoreHorizontal size={14} />
                    </button>
                    <button onClick={() => onDeleteList(list._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[50px] space-y-3 pr-1 scrollbar-hide">
                <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onDelete={onDeleteTask}
                            onAssignUser={onAssignUser}
                            allUsers={allUsers}
                        />
                    ))}
                </SortableContext>
            </div>

            <form onSubmit={handleAddTask} className="mt-6 flex items-center bg-white/5 rounded-2xl p-1 border border-transparent focus-within:border-brand-500/30 transition-all">
                <input
                    type="text"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder-slate-500 pl-3 py-2"
                    placeholder="Add task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <button type="submit" className="p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-400 transition-all shadow-lg active:scale-90 flex-shrink-0">
                    <Plus size={16} />
                </button>
            </form>
        </div>
    );
};

export default List;
