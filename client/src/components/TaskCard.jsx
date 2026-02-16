import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Calendar, AlignLeft, Users, UserPlus } from 'lucide-react';
import { useState } from 'react';

const TaskCard = ({ task, onDelete, onAssignUser, allUsers }) => {
    const [showUserSelector, setShowUserSelector] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task._id, data: { type: 'Task', task } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        cursor: 'grab'
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative bg-[#1e293b]/60 border border-white/5 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:bg-[#1e293b]/80 hover:border-white/10 transition-all duration-300 active:cursor-grabbing"
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task._id);
                }}
                className="absolute top-3 right-3 p-1.5 bg-slate-800/80 rounded-lg text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all transform hover:rotate-90"
            >
                <X size={12} />
            </button>

            <div className="space-y-3">
                <div className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'Medium'}
                </div>

                <h4 className="text-sm font-bold text-white leading-tight group-hover:text-brand-400 transition-colors">
                    {task.title}
                </h4>

                {task.description && (
                    <div className="flex items-start space-x-2 text-slate-500">
                        <AlignLeft size={12} className="mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] line-clamp-2 leading-relaxed">{task.description}</p>
                    </div>
                )}

                <div className="flex items-center space-x-2 flex-wrap gap-y-2 relative">
                    {task.assignees?.map(user => (
                        <div
                            key={user._id}
                            title={user.username || 'Unknown'}
                            className="w-6 h-6 rounded-full bg-brand-500 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white uppercase shadow-sm"
                        >
                            {(user.username || '?').charAt(0)}
                        </div>
                    ))}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowUserSelector(!showUserSelector); }}
                        className="p-1 hover:bg-white/5 rounded-full text-slate-500 hover:text-brand-400 transition-colors"
                    >
                        <UserPlus size={14} />
                    </button>

                    {showUserSelector && (
                        <div className="absolute top-8 left-0 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto p-1 backdrop-blur-md">
                            {allUsers.map(user => {
                                const isAssigned = task.assignees?.some(u => u._id === user._id);
                                return (
                                    <button
                                        key={user._id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAssignUser(task._id, user._id);
                                            setShowUserSelector(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${isAssigned ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <span>{user.username}</span>
                                        {isAssigned && <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center space-x-2 text-slate-500">
                        <Calendar size={12} />
                        <span className="text-[10px] font-medium tracking-wide">Today</span>
                    </div>
                    <div className="flex -space-x-1">
                        {/* Placeholder for future features or total team count */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
