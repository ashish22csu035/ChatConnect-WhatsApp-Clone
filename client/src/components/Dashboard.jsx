import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import Navbar from './Navbar';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import VideoCall from './VideoCall';
import { Phone, PhoneOff } from 'lucide-react';

const Dashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      
      socket.on('webrtc-offer', ({ from, offer, callerName }) => {
        console.log(' Dashboard: Incoming call from', callerName);
        setIncomingCall({
          from,
          callerName,
          offer
        });
      });

      return () => {
        socket.off('webrtc-offer');
      };
    }
  }, [socket]);

  const handleStartVideoCall = (user, video) => {
    console.log(' Starting call to:', user.name, 'User ID:', user._id);
    console.log(' Video call:', video);
    setSelectedUser(user);
    setIsVideoCall(video);
    setInCall(true);
  };

  const handleAcceptCall = () => {
    console.log(' Accepting incoming call');
    
    setSelectedUser({
      _id: incomingCall.from,
      name: incomingCall.callerName
    });
    setIsVideoCall(true);
    setInCall(true);
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    console.log(' Rejecting call');
    if (socket && incomingCall) {
      socket.emit('reject-call', { to: incomingCall.from });
    }
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setInCall(false);
    setIncomingCall(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <UserList selectedUser={selectedUser} onSelectUser={setSelectedUser} />
        <ChatWindow
          selectedUser={selectedUser}
          onStartVideoCall={handleStartVideoCall}
        />
      </div>

      {/* Incoming Call Notification */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
            <div className="mb-6">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <Phone className="text-white" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Incoming Call</h2>
              <p className="text-gray-600 text-lg">
                {incomingCall.callerName} is calling you...
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleAcceptCall}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full flex items-center gap-2 text-lg font-semibold shadow-lg transition-all"
              >
                <Phone size={24} />
                Accept
              </button>
              <button
                onClick={handleRejectCall}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full flex items-center gap-2 text-lg font-semibold shadow-lg transition-all"
              >
                <PhoneOff size={24} />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Overlay */}
      {inCall && (
        <VideoCall
          receiver={selectedUser}
          isVideoCall={isVideoCall}
          onEndCall={handleEndCall}
          incomingCallData={incomingCall}
        />
      )}
    </div>
  );
};

export default Dashboard;