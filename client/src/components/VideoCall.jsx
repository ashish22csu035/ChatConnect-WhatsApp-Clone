import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";

const VideoCall = ({ receiver, isVideoCall, onEndCall, incomingCallData }) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);

  const { socket } = useSocket();
  const { user } = useAuth();

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // Get media
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: isVideoCall, audio: true })
      .then((localStream) => {
        setStream(localStream);
        if (myVideo.current) myVideo.current.srcObject = localStream;
      })
      .catch(() => {
        alert("Camera/Mic access denied");
        onEndCall();
      });
  }, []);

  useEffect(() => {
    if (!stream || !socket || !user) return;

    const peer = new RTCPeerConnection(servers);
    peerRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (e) => {
      const rs = e.streams[0];
      setRemoteStream(rs);
      if (userVideo.current) userVideo.current.srcObject = rs;
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: receiver?._id || incomingCallData?.from,
          from: user._id,
          candidate: e.candidate,
        });
      }
    };

    if (!incomingCallData && receiver) {
      peer
        .createOffer()
        .then((offer) => peer.setLocalDescription(offer))
        .then(() => {
          socket.emit("offer", {
            to: receiver._id,
            from: user._id,
            name: user.name,
            offer: peer.localDescription,
          });
        });
    }

    if (incomingCallData?.offer) {
      peer
        .setRemoteDescription(new RTCSessionDescription(incomingCallData.offer))
        .then(() => peer.createAnswer())
        .then((answer) => peer.setLocalDescription(answer))
        .then(() => {
          socket.emit("answer", {
            to: incomingCallData.from,
            answer: peer.localDescription,
          });
        });
    }

    socket.on("answer", async (data) => {
      await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("ice-candidate", async (data) => {
      if (data.candidate && peer.remoteDescription) {
        await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    return () => {
      socket.off("answer");
      socket.off("ice-candidate");
      peer.close();
    };
  }, [stream, socket, user]);

  const endCall = () => {
    socket.emit("end-call", { to: receiver?._id || incomingCallData?.from });
    if (peerRef.current) peerRef.current.close();
    if (stream) stream.getTracks().forEach((t) => t.stop());
    onEndCall();
  };

  const toggleMute = () => {
    if (!stream) return;
    stream.getAudioTracks()[0].enabled = isMuted;
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <video ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
      <video ref={myVideo} autoPlay playsInline muted className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white" />

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <button onClick={toggleMute} className={`${isMuted ? "bg-red-500" : "bg-gray-700"} p-4 rounded-full text-white`}>
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        <button onClick={endCall} className="bg-red-500 p-4 rounded-full text-white">
          <PhoneOff />
        </button>

        {isVideoCall && (
          <button onClick={toggleVideo} className={`${!isVideoEnabled ? "bg-red-500" : "bg-gray-700"} p-4 rounded-full text-white`}>
            {isVideoEnabled ? <VideoIcon /> : <VideoOff />}
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
