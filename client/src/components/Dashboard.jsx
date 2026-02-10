import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import Navbar from "./Navbar";
import UserList from "./UserList";
import ChatWindow from "./ChatWindow";
import VideoCall from "./VideoCall";
import { Phone, PhoneOff } from "lucide-react";

const Dashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const { socket } = useSocket();

  // ✅ Listen for incoming calls globally
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log("📞 Incoming call:", data);
      setIncomingCall({
        from: data.from,
        offer: data.offer,
        callerName: data.name,
      });
    };

    socket.on("offer", handleIncomingCall);

    socket.on("call-ended", () => {
      handleEndCall();
    });

    socket.on("call-rejected", () => {
      alert("Call was rejected");
      handleEndCall();
    });

    return () => {
      socket.off("offer", handleIncomingCall);
      socket.off("call-ended");
      socket.off("call-rejected");
    };
  }, [socket]);

  /* ================= START CALL ================= */
  const handleStartVideoCall = (user, video) => {
    console.log("📞 Starting call to:", user.name);
    setSelectedUser(user);
    setIsVideoCall(video);
    setInCall(true);
  };

  /* ================= ACCEPT CALL ================= */
  const handleAcceptCall = () => {
    console.log("✅ Accepting call");

    setSelectedUser({
      _id: incomingCall.from,
      name: incomingCall.callerName,
    });

    setIsVideoCall(true);
    setInCall(true);
  };

  /* ================= REJECT CALL ================= */
  const handleRejectCall = () => {
    console.log("❌ Rejecting call");
    if (socket && incomingCall) {
      socket.emit("reject-call", { to: incomingCall.from });
    }
    setIncomingCall(null);
  };

  /* ================= END CALL ================= */
  const handleEndCall = () => {
    setInCall(false);
    setIncomingCall(null);
    setSelectedUser(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <UserList
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />

        <ChatWindow
          selectedUser={selectedUser}
          onStartVideoCall={handleStartVideoCall}
        />
      </div>

      {/* Incoming Call UI */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
            <div className="mb-6">
              <div className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <Phone className="text-white" size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
              <p className="text-gray-600 text-lg">
                {incomingCall.callerName} is calling you…
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleAcceptCall}
                className="bg-green-500 text-white px-8 py-4 rounded-full flex items-center gap-2"
              >
                <Phone />
                Accept
              </button>

              <button
                onClick={handleRejectCall}
                className="bg-red-500 text-white px-8 py-4 rounded-full flex items-center gap-2"
              >
                <PhoneOff />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call */}
      {inCall && (
        <VideoCall
          receiver={selectedUser}
          isVideoCall={isVideoCall}
          incomingCallData={incomingCall}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
};

export default Dashboard;
