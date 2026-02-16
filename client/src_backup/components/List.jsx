import { Trash2, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { useState } from 'react';

const List = ({ list, tasks, onDeleteList, onAddTask, onDeleteTask }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: list._id, data: { type: 'List', list } });

    const style = {
        transform: CSS.Transform.toString(transform),
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
            className="bg-gray-100 w-80 flex-shrink-0 rounded-lg p-3 flex flex-col max-h-full"
        >
            <div
                {...attributes}
                {...listeners}
                className="flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing p-1"
            >
                <h3 className="font-semibold text-gray-700">{list.title}</h3>
                <button onClick={() => onDeleteList(list._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[50px]">
                <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskCard key={task._id} task={task} onDelete={onDeleteTask} />
                    ))}
                </SortableContext>
            </div>

            <form onSubmit={handleAddTask} className="mt-3 flex items-center">
                <button type="submit" className="text-gray-500 hover:text-brand-600 mr-1">
                    <Plus size={16} />
                </button>
                <input
                    type="text"
                    className="w-full px-2 py-1 text-sm bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none"
                    placeholder="Add a task"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                />
            </form>
        </div>
    );
};

export default List;
