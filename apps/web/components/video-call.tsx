"use client"; import { useEffect, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";
import { Socket } from "socket.io-client";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface VideoCallProps {
  roomId: string;
  socket: Socket;
  myUserId: string;
  userName?: string;
}

export default function VideoCall({ roomId, socket, myUserId, userName }: VideoCallProps) {
  const router = useRouter();

  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Initialize Peer & Media
  useEffect(() => {
    if (!myUserId) return;

    // --- Setup Peer ---
    // dynamic config based on env (for tunnels/prod) or local fallback
    const getPeerConfig = () => {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl) {
        try {
          const { hostname, port, protocol } = new URL(envUrl);
          return {
            host: hostname,
            port: port ? parseInt(port) : (protocol === 'https:' ? 443 : 80),
            path: "/peerjs/myapp",
            secure: protocol === 'https:'
          };
        } catch (e) { console.error("Invalid API URL", e); }
      }
      return {
        host: window.location.hostname,
        port: 4000,
        path: "/peerjs/myapp",
        secure: false
      };
    };

    const config = getPeerConfig();
    console.log("Peer Config:", config);

    // Fix: Pass config as the only argument. 
    // PeerJS overloads allow 'new Peer(options)' for auto-generated IDs.
    const peer = new Peer(config);
    peerInstance.current = peer;

    peer.on("open", (id) => {
      console.log("✅ My Peer ID is:", id);
      setPeerId(id);
    });

    peer.on("error", (err) => {
      console.error("❌ PeerJS Error:", err);
    });

    // --- Answer Calls Immediately ---
    // Move this OUTSIDE getUserMedia so we don't miss calls while waiting for permissions
    peer.on("call", (call) => {
      console.log("📞 Receiving call from:", call.peer);
      
      // If stream isn't ready yet, we can't answer properly with video.
      // But we can try to answer and add stream later, or wait.
      // Better strategy: We don't join the room until stream is ready, so this shouldn't happen often.
      // However, if it does, we try to use the ref.
      const stream = streamRef.current;
      if (stream) {
        call.answer(stream);
        handleCall(call);
      } else {
        console.warn("⚠️ Received call but stream not ready! Answering without stream for now (or waiting).");
        // Option: Answer with empty stream or wait? 
        // PeerJS `answer` requires a stream if we want two-way.
        // Let's rely on the "Don't join until ready" strategy to prevent this.
      }
    });

    // --- Get Media ---
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("📷 Camera access granted");
        setMyStream(stream);
        streamRef.current = stream;

        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
          myVideoRef.current.muted = true;
        }
      })
      .catch(err => console.error("❌ Failed to get media:", err));

    return () => {
      peer.destroy();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [myUserId]);

  // 2. Join Room ONLY when BOTH Peer & Stream are ready
  useEffect(() => {
    if (!peerId || !myStream) return;

    console.log("🚀 Everything ready (Peer + Stream). Joining socket room...");
    socket.emit("join-room", roomId, peerId, userName);

    // Cleanup: Leave room on unmount (handled by socket disconnect usually)
  }, [peerId, myStream, roomId, socket, userName]);


  // 3. Handle Socket Events (User Connected)
  useEffect(() => {
    if (!socket) return;

    const handleUserConnected = (newUserId: string) => {
      console.log("👋 User connected:", newUserId);
      // Wait a bit for their Peer to be ready (just in case)
      setTimeout(() => initiateCall(newUserId), 1000);
    };

    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [socket, myStream]); // Dependency on myStream ensures we have it before defining initiateCall

  const initiateCall = (targetId: string, retries = 3) => {
    // Double check stream before calling
    if (!streamRef.current || !peerInstance.current) {
      console.warn("⚠️ Cannot call: Stream or Peer not ready.");
      return;
    }

    console.log(`☎️ Calling ${targetId}...`);
    try {
      const call = peerInstance.current.call(targetId, streamRef.current);
      if (!call) throw new Error("Call failed to initialize");

      handleCall(call);

      call.on("close", () => setPeerConnected(false));
      // @ts-ignore
      call.on("error", (err) => console.error("Call error:", err));
      
    } catch (err) {
      console.error("Call execution failed:", err);
      if (retries > 0) {
        setTimeout(() => initiateCall(targetId, retries - 1), 1000);
      }
    }
  };

  // Helper to handle stream events
  function handleCall(call: MediaConnection) {
    call.on("stream", (remoteStream) => {
      console.log("📺 Remote stream received!");
      setPeerConnected(true);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    call.on("close", () => {
      setPeerConnected(false);
    });
  }

  // --- CONTROLS ---
  const toggleMute = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!audioTrack.enabled); }
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsVideoOff(!videoTrack.enabled); }
    }
  };

  const endCall = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    peerInstance.current?.destroy();
    socket.disconnect();
    router.push("/");
  };

  return (
    <div className="relative w-full h-full bg-zinc-900 overflow-hidden flex flex-col">
      {/* REMOTE VIDEO */}
      <div className="absolute inset-0 z-0 bg-zinc-900">
        <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />

        {!peerConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 z-10 bg-zinc-950/80 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 animate-pulse shadow-xl">
              <Loader2 className="w-8 h-8 opacity-50 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Waiting for candidate...</p>
            <p className="text-xs text-zinc-500 mt-2">Share the invite link to start</p>
          </div>
        )}
      </div>

      {/* SELF VIDEO */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 w-16 md:w-32 aspect-[3/4] bg-black rounded-xl overflow-hidden border border-zinc-700 shadow-2xl z-20 hover:scale-105 transition-transform duration-300">
        <video ref={myVideoRef} autoPlay muted className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
        <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 bg-black/60 px-1 py-0.5 md:px-2 md:py-0.5 rounded text-[8px] md:text-[10px] text-white font-medium backdrop-blur-md">YOU</div>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-2 left-0 right-0 z-50 flex justify-center md:bottom-6">
        <div className="flex items-center gap-2 md:gap-4 px-3 py-2 md:px-6 md:py-3 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-full shadow-2xl">
          <button onClick={toggleMute} className={`p-2 md:p-3.5 rounded-full transition-all ${isMuted ? "bg-red-500/20 text-red-500" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            {isMuted ? <MicOff className="w-3 h-3 md:w-5 md:h-5" /> : <Mic className="w-3 h-3 md:w-5 md:h-5" />}
          </button>
          <button onClick={toggleVideo} className={`p-2 md:p-3.5 rounded-full transition-all ${isVideoOff ? "bg-red-500/20 text-red-500" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            {isVideoOff ? <VideoOff className="w-3 h-3 md:w-5 md:h-5" /> : <Video className="w-3 h-3 md:w-5 md:h-5" />}
          </button>
          <div className="w-[1px] h-4 mx-0.5 md:h-8 md:mx-1 bg-zinc-800"></div>
          <button onClick={endCall} className="p-2 md:p-3.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20">
            <PhoneOff className="w-3 h-3 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
