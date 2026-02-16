import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const [boards, setBoards] = useState([]);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const { user, logout } = useAuth();

    useEffect(() => {
        const fetchBoards = async () => {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/boards', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBoards(res.data);
        };
        fetchBoards();
    }, []);

    const createBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle) return;

        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:5000/api/boards', { title: newBoardTitle }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setBoards([...boards, res.data]);
        setNewBoardTitle('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold text-brand-600">TaskFlow</h1>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">Welcome, {user?.username}</span>
                            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Your Boards</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {boards.map(board => (
                            <Link to={`/board/${board._id}`} key={board._id} className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-lg font-medium text-gray-900">{board.title}</h3>
                            </Link>
                        ))}

                        <div className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-500 transition-colors duration-200 flex flex-col justify-center items-center">
                            <form onSubmit={createBoard} className="w-full">
                                <input
                                    type="text"
                                    placeholder="New Board Title"
                                    className="w-full mb-2 px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    value={newBoardTitle}
                                    onChange={(e) => setNewBoardTitle(e.target.value)}
                                />
                                <button type="submit" className="w-full py-2 bg-brand-600 text-white rounded hover:bg-brand-700">
                                    Create Board
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
