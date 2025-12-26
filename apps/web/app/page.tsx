"use client";
import { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { useRouter } from "next/navigation";
import { Code2, Video, Zap, Keyboard, ArrowRight } from "lucide-react";

// UI Components (Shadcn)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isJoinLoading, setIsJoinLoading] = useState(false);

  function handleJoinRoom() {
    setIsJoinLoading(true);
    // If user typed a name, use it. Otherwise, generate random ID.
    const id = roomName.trim() || uuidV4();
    router.push(`/room/${id}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-blue-500/30">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold tracking-tighter">Code<span className="text-blue-500">Stream</span></div>
        <a href="https://github.com" target="_blank" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Star on GitHub</a>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-[-50px]">
        <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
          v1.0 Now Live
        </div>

        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Technical Interviews, <br /> Reimagined.
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          The most advanced open-source interview platform.
          Real-time collaborative code editor, HD video calling,
          and secure remote code execution in one browser tab.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">

          {/* --- MODAL TRIGGER --- */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.6)]"
              >
                Create New Interview
              </Button>
            </DialogTrigger>

            {/* --- MODAL CONTENT --- */}
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Create Interview Room</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Room Name (Optional)</label>
                  <div className="relative">
                    <Keyboard className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="e.g. daily-standup"
                      className="pl-9 bg-black border-zinc-700 focus-visible:ring-blue-600"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Leave blank to generate a secure random ID.</p>
                </div>

                <Button
                  onClick={handleJoinRoom}
                  disabled={isJoinLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500"
                >
                  {isJoinLoading ? "Creating..." : "Launch Room"}
                  {!isJoinLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* --- JOIN INPUT --- */}
          <div className="flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-2 h-12">
            <input
              placeholder="Enter Room ID"
              className="bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-zinc-600 w-32 h-full px-2"
              onChange={(e) => setRoomName(e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleJoinRoom}
              className="text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full h-8"
            >
              JOIN
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-24 w-full text-left max-w-5xl">
          <FeatureCard
            icon={<Code2 className="w-6 h-6 text-blue-400" />}
            title="Collaborative Editor"
            desc="Monaco-based editor with real-time syntax highlighting and multi-cursor support."
          />
          <FeatureCard
            icon={<Video className="w-6 h-6 text-purple-400" />}
            title="HD Video & Audio"
            desc="Built-in low latency WebRTC video calling. No third-party tools needed."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-yellow-400" />}
            title="Remote Execution"
            desc="Run code safely in isolated Docker containers with instant output."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors cursor-default">
      <div className="mb-4 bg-zinc-900 w-12 h-12 rounded-lg flex items-center justify-center border border-zinc-800 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-zinc-200">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  )
}
