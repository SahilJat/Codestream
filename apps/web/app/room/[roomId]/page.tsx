"use client";
import { useEffect, useState } from "react";
import CodeEditor from "@/components/code-editor";
import VideoCall from "@/components/video-call";
import { io } from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import { useParams } from "next/navigation";
import { Copy, Check } from "lucide-react";

// Initialize socket outside to prevent re-connections
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
console.log("🔌 Connecting to Socket.io Server at:", API_URL);
// ✅ New Working URL
const socket = io("https://13.232.9.23.sslip.io");

export default function InterviewPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Only generate ID on mount, DO NOT join room yet
    setUserId(uuidV4());
  }, []);

  function joinRoom() {
    if (!userName.trim()) return;
    setHasJoined(true);
    // Note: We do NOT emit "join-room" here anymore.
    // We wait until VideoCall loads and connects to PeerJS first.
  }

  function copyInvite() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hasJoined) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter">Join Interview</h1>
            <p className="text-zinc-400">Enter your name to join the session.</p>
          </div>

          <div className="space-y-4">
            <div className="text-left space-y-1.5">
              <label className="text-sm font-medium leading-none text-zinc-400">Display Name</label>
              <input
                autoFocus
                className="w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. John Doe"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              />
            </div>
            <button
              onClick={joinRoom}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) return <div className="text-white">Loading...</div>;

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-zinc-800 flex items-center px-6 justify-between bg-zinc-950 z-20 relative">
        <div className="font-bold text-xl">Code<span className="text-blue-500">Stream</span></div>
        <div className="flex items-center gap-4">
          <button onClick={copyInvite} className="flex items-center gap-2 text-xs bg-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-700 transition-all">
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Invite Link"}
          </button>
          <div className="text-xs font-medium px-3 py-1 bg-blue-900/20 text-blue-200 rounded-full border border-blue-900/50">
            {userName}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex min-h-0">
        <div className="flex-1 border-r border-zinc-800 p-4 relative overflow-auto custom-scrollbar">
          <CodeEditor roomId={roomId} socket={socket} />
        </div>
        <div className="w-[400px] bg-zinc-950 border-l border-zinc-800 relative flex flex-col shrink-0">
          <VideoCall roomId={roomId} socket={socket} myUserId={userId} userName={userName} />
        </div>
      </main>
    </div>
  );
}
