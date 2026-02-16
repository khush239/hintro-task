import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';

const TaskCard = ({ task, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task._id, data: { type: 'Task', task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 rounded shadow-sm mb-2 cursor-grab active:cursor-grabbing group hover:shadow-md transition-shadow duration-200"
        >
            <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start
                        onDelete(task._id);
                    }}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X size={14} />
                </button>
            </div>
            {task.description && <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>}
            <div className="mt-2 flex justify-between items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    {task.priority}
                </span>
            </div>
        </div>
    );
};

export default TaskCard;
