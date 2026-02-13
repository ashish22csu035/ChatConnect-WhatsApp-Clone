import { useState, useEffect } from 'react';
import { chatAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { Search, Circle } from 'lucide-react';

const UserList = ({ selectedUser, onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (socket) {
      
      socket.on('user-status-change', ({ userId, isOnline }) => {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === userId ? { ...user, isOnline } : user
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('user-status-change');
      }
    };
  }, [socket]);

  const fetchUsers = async () => {
    try {
      const { data } = await chatAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
      
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => onSelectUser(user)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedUser?._id === user._id ? 'bg-light' : ''
              }`}
            >
              
              <div className="relative">
                <img
                  src={user.profilePicture || 'https://via.placeholder.com/48'}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                
                <Circle
                  size={12}
                  className={`absolute bottom-0 right-0 ${
                    user.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
                  }`}
                />
              </div>

              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {user.isOnline ? 'Online' : `Last seen: ${new Date(user.lastSeen).toLocaleTimeString()}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;