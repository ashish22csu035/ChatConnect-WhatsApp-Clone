import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const VideoCall = ({ receiver, isVideoCall, onEndCall, incomingCallData }) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(!!incomingCallData);
  const [caller, setCaller] = useState(incomingCallData || null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  
  const { socket } = useSocket();
  const { user } = useAuth();
  const myVideo = useRef();
  const userVideo = useRef();
  const peerConnection = useRef(null);

  // ICE servers for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Get user media
    navigator.mediaDevices
      .getUserMedia({ video: isVideoCall, audio: true })
      .then((currentStream) => {
        console.log('📹 Got local stream');
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        alert('Please allow camera and microphone access');
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming call
    socket.on('webrtc-offer', async ({ from, offer, callerName }) => {
      console.log('📲 Received call from:', callerName);
      setReceivingCall(true);
      setCaller({ id: from, name: callerName, offer });
    });

    // Listen for answer
    socket.on('webrtc-answer', async ({ answer }) => {
      console.log('✅ Call answered');
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallAccepted(true);
      }
    });

    // Listen for ICE candidates
    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      console.log('🧊 Received ICE candidate');
      if (peerConnection.current && candidate) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Call rejected
    socket.on('call-rejected', () => {
      console.log('❌ Call rejected');
      alert('Call was rejected');
      handleEndCall();
    });

    // Call ended
    socket.on('call-ended', () => {
      console.log('📴 Call ended');
      handleEndCall();
    });

    return () => {
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [socket]);

  // Create peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    // Add local stream tracks individually
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('➕ Adding local track:', track.kind);
        pc.addTrack(track, stream);
      });
    }

    // Handle remote stream - CRITICAL FIX
    pc.ontrack = (event) => {
      console.log('📺 ontrack event fired!');
      console.log('   Track kind:', event.track.kind);
      console.log('   Track id:', event.track.id);
      console.log('   Streams count:', event.streams.length);
      
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log('   Remote stream ID:', remoteStream.id);
        console.log('   Remote tracks:', remoteStream.getTracks().length);
        
        if (userVideo.current) {
          console.log('✅ Setting remote stream to video element');
          userVideo.current.srcObject = remoteStream;
          
          // Ensure video plays
          userVideo.current.play()
            .then(() => console.log('✅ Remote video playing'))
            .catch(err => console.error('❌ Remote video play failed:', err));
        } else {
          console.error('❌ userVideo ref is null!');
        }
        
        // Set call as accepted when we receive tracks
        setCallAccepted(true);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Sending ICE candidate');
        socket.emit('webrtc-ice-candidate', {
          to: receiver?._id || caller?.id,
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ Peer connection established!');
        setCallAccepted(true);
      } else if (pc.connectionState === 'failed') {
        console.error('❌ Peer connection failed');
        alert('Connection failed. Please try again.');
        handleEndCall();
      } else if (pc.connectionState === 'disconnected') {
        console.log('⚠️ Peer disconnected');
      }
    };

    // ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
    };

    // Signaling state
    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    return pc;
  };

  // Call user
  const callUser = async () => {
    if (!stream || !socket) {
      console.error('❌ Stream or socket not ready');
      return;
    }

    console.log('📞 Initiating call to:', receiver.name);
    console.log('📞 Receiver ID:', receiver._id);
    console.log('📞 My ID:', user._id);
    
    peerConnection.current = createPeerConnection();

    try {
      // Create offer with specific options
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall
      });
      
      console.log('📄 Created offer:', offer.type);
      await peerConnection.current.setLocalDescription(offer);
      console.log('✅ Set local description');

      console.log('📡 Sending offer to:', receiver._id);
      socket.emit('webrtc-offer', {
        to: receiver._id,
        offer,
        from: user._id,
        callerName: user.name
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      alert('Failed to initiate call: ' + error.message);
      handleEndCall();
    }
  };

  // Answer call
  const answerCall = async () => {
    if (!caller || !stream || !socket) {
      console.error('❌ Cannot answer call - missing:', { 
        caller: !!caller, 
        stream: !!stream, 
        socket: !!socket 
      });
      return;
    }

    console.log('✅ Answering call from:', caller.name);
    console.log('📞 Caller ID:', caller.id);
    console.log('📞 My ID:', user._id);
    setReceivingCall(false);

    peerConnection.current = createPeerConnection();

    try {
      console.log('📄 Received offer:', caller.offer.type);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(caller.offer));
      console.log('✅ Set remote description');
      
      const answer = await peerConnection.current.createAnswer();
      console.log('📄 Created answer:', answer.type);
      
      await peerConnection.current.setLocalDescription(answer);
      console.log('✅ Set local description');

      console.log('📡 Sending answer to:', caller.id);
      socket.emit('webrtc-answer', {
        to: caller.id,
        answer
      });

      setCallAccepted(true);
    } catch (error) {
      console.error('❌ Error answering call:', error);
      alert('Failed to answer call: ' + error.message);
      handleEndCall();
    }
  };

  // End call
  const handleEndCall = () => {
    console.log('📴 Ending call');
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (socket && (receiver?._id || caller?.id)) {
      socket.emit('end-call', { to: receiver?._id || caller?.id });
    }
    
    onEndCall();
  };

  // Toggle mute
  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  // Auto-call when stream is ready (only if initiating, not receiving)
  useEffect(() => {
    if (stream && receiver && !receivingCall && !incomingCallData) {
      const timer = setTimeout(() => {
        callUser();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stream]);

  // Auto-answer if incoming call data provided
  useEffect(() => {
    if (stream && incomingCallData && receivingCall) {
      console.log('📲 Auto-answering incoming call');
      const timer = setTimeout(() => {
        answerCall();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stream, incomingCallData]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
      <div className="w-full h-full relative">
        {/* Remote Video (Full Screen) */}
        <video
          playsInline
          ref={userVideo}
          autoPlay
          onLoadedMetadata={(e) => {
            console.log('📺 Remote video metadata loaded');
            console.log('   Video dimensions:', e.target.videoWidth, 'x', e.target.videoHeight);
            console.log('   Video ready state:', e.target.readyState);
            e.target.play()
              .then(() => console.log('✅ Remote video playing'))
              .catch(err => console.error('❌ Remote play error:', err));
          }}
          onPlay={() => console.log('▶️ Remote video started playing')}
          onError={(e) => console.error('❌ Remote video error:', e)}
          className="w-full h-full object-cover bg-gray-800"
        />

        {/* My Video (Picture-in-Picture) */}
        <video
          playsInline
          muted
          ref={myVideo}
          autoPlay
          onLoadedMetadata={(e) => {
            console.log('📹 Local video metadata loaded');
            e.target.play().catch(err => console.error('Local play error:', err));
          }}
          className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg bg-gray-700"
        />

        {/* Connecting UI */}
        {!callAccepted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <Phone className="text-white" size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {receivingCall ? 'Connecting...' : 'Calling...'}
              </h2>
              <p className="text-gray-300">{receiver?.name}</p>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleMute}
            className={`${isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-gray-600 text-white p-4 rounded-full`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full"
          >
            <PhoneOff size={24} />
          </button>

          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`${isVideoEnabled ? 'bg-gray-700' : 'bg-red-500'} hover:bg-gray-600 text-white p-4 rounded-full`}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
          )}
        </div>

        {/* User Name */}
        {callAccepted && (
          <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
            <p className="font-semibold">{receiver?.name || caller?.name || 'Unknown'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;