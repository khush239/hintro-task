import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Layout, Plus, LogOut, Settings, User, Loader2, Search } from 'lucide-react';

const Dashboard = () => {
    const [boards, setBoards] = useState([]);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        const fetchBoards = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('http://localhost:5000/api/boards', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBoards(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBoards();
    }, []);

    const createBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle) return;
        setIsCreating(true);

        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://localhost:5000/api/boards', { title: newBoardTitle }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBoards([...boards, res.data]);
            setNewBoardTitle('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    console.log('Dashboard: Rendering, loading:', isLoading, 'boards count:', boards.length);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            {/* Sidebar / Nav */}
            <nav className="fixed top-0 left-0 w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-3 group cursor-pointer">
                            <div className="bg-brand-500 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                                <Layout className="text-white w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tighter">TaskFlow</h1>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <span>{user?.username}</span>
                            </div>
                            <button onClick={logout} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-red-400 transition-colors">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0 text-center md:text-left">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-2">Workspace</h2>
                        <p className="text-slate-400">Manage your projects and collaboration boards</p>
                    </div>
                    <div className="relative group max-w-sm w-full mx-auto md:mx-0">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search your workspaces..."
                            className="w-full bg-slate-800/30 backdrop-blur-sm border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-slate-800/50 transition-all placeholder:text-slate-600 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-brand-500 w-12 h-12" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {boards
                            .filter(board => board?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((board, index) => (
                                <Link
                                    to={`/board/${board._id}`}
                                    key={board._id}
                                    className="group relative p-6 bg-slate-800/40 border border-white/5 rounded-2xl hover:border-brand-500/50 hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-brand-500/20 transition-all" />
                                    <h3 className="text-xl font-bold text-white relative z-10">{board.title}</h3>
                                    <div className="mt-4 flex items-center justify-between relative z-10">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px]">
                                                    {String.fromCharCode(64 + i)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-500 group-hover:text-brand-400 transition-colors">View Board →</span>
                                    </div>
                                </Link>
                            ))}

                        {boards.filter(board => board?.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && searchQuery && (
                            <div className="col-span-full py-20 text-center bg-slate-800/10 border border-dashed border-white/5 rounded-3xl">
                                <Search size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-slate-400">No workspaces found</h3>
                                <p className="text-slate-600 text-sm">We couldn't find any projects matching "{searchQuery}"</p>
                            </div>
                        )}

                        {/* Create New Board Card */}
                        <div className="group relative p-6 bg-slate-800/20 border-2 border-dashed border-white/10 rounded-2xl hover:border-brand-500/50 transition-all duration-300">
                            <form onSubmit={createBoard} className="h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white">Create New</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter Board Title"
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                        value={newBoardTitle}
                                        onChange={(e) => setNewBoardTitle(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="mt-6 w-full py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/10 transition-all active:scale-95"
                                >
                                    {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus size={20} />}
                                    <span>{isCreating ? 'Creating...' : 'Launch Project'}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
