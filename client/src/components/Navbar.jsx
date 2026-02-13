import { useAuth } from '../context/AuthContext';
import { LogOut, MessageCircle, Video } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-secondary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-full p-2">
              <div className="flex gap-1">
                <MessageCircle size={20} />
                <Video size={20} />
              </div>
            </div>
            <span className="text-xl font-bold">ChatConnect</span>
          </div>

          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src={user?.profilePicture || 'https://via.placeholder.com/40'}
                alt={user?.name}
                className="w-10 h-10 rounded-full border-2 border-primary"
              />
              <div className="hidden md:block">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-xs text-gray-300">{user?.email}</p>
              </div>
            </div>

            
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;