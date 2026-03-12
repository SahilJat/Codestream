"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import { Play, Loader2, Terminal } from "lucide-react"; // Icons for UI

interface CodeEditorProps {
  roomId: string;
  socket: Socket;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", defaultCode: "// Start coding here...\nconsole.log('Hello World!');", ext: "js" },
  { value: "python", label: "Python", defaultCode: "# Start coding here...\nprint('Hello World!')", ext: "py" },
  { value: "cpp", label: "C++", defaultCode: "#include <iostream>\n\nint main() {\n    std::cout << \"Hello World!\" << std::endl;\n    return 0;\n}", ext: "cpp" },
  { value: "java", label: "Java", defaultCode: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World!\");\n    }\n}", ext: "java" },
];

export default function CodeEditor({ roomId, socket }: CodeEditorProps) {
  // --- State Management ---
  const [language, setLanguage] = useState(LANGUAGES[0].value);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Flag to prevent infinite loops (Server -> Client -> Server)
  const isRemoteUpdate = useRef(false);

  // --- 1. Socket Connection Logic ---
  useEffect(() => {
    if (!socket) return;

    // Listen for updates from other users
    const handleCodeUpdate = (newCode: string) => {
      console.log("Remote update received");
      isRemoteUpdate.current = true; // Mark as remote
      setCode(newCode);
    };

    socket.on("code-update", handleCodeUpdate);

    // Cleanup listener on unmount
    return () => {
      socket.off("code-update", handleCodeUpdate);
    };
  }, [socket]);

  // --- 2. Local Editor Change Handler ---
  function handleEditorChange(value: string | undefined) {
    if (isRemoteUpdate.current) {
      // If the change came from the server, we don't emit it back
      isRemoteUpdate.current = false;
      return;
    }

    if (value !== undefined) {
      setCode(value);
      // Emit changes to other users
      socket.emit("code-change", { roomId, code: value });
    }
  }

  function handleLanguageChange(newLang: string) {
    setLanguage(newLang);
    const langObj = LANGUAGES.find((l) => l.value === newLang);
    if (langObj) {
      const newCode = langObj.defaultCode;
      setCode(newCode);
      // We also might want to emit the language change in the future, 
      // but for now, we just update the code.
      socket.emit("code-change", { roomId, code: newCode });
    }
  }

  // --- 3. Run Code Logic (Docker Integration) ---
  async function runCode() {
    setIsRunning(true);
    setOutput([]); // Clear previous output

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      // Handle API errors
      if (data.error) {
        setOutput([`Error: ${data.error}`]);
      } else {
        // Split output by newlines to render nicely
        // Use a default message if stdout is empty
        const lines = data.output ? data.output.split("\n") : ["(No output)"];
        setOutput(lines);
      }

    } catch (error) {
      console.error(error);
      setOutput(["System Error: Failed to connect to execution server."]);
    } finally {
      setIsRunning(false);
    }
  }

  const currentLangObj = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col h-full gap-4">

      {/* --- EDITOR CONTAINER --- */}
      <div className="flex flex-col border border-zinc-700 rounded-lg overflow-hidden shadow-2xl bg-zinc-950">

        {/* Toolbar */}        <div className="flex justify-between items-center bg-zinc-900 px-4 py-2 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs font-mono">main.{currentLangObj.ext}</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-[10px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Live
              </span>
            </div>
            
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-1 outline-none border border-zinc-700 focus:border-zinc-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runCode}
            disabled={isRunning}
            className={`
                    flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all
                    ${isRunning
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
              }
                `}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                Run Code
              </>
            )}
          </button>
        </div>

        {/* Monaco Editor */}        <div className="h-[450px] w-full">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "Fira Code, monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 },
            }}
          />
        </div>
      </div>

      {/* --- TERMINAL OUTPUT --- */}      <div className="flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-black shadow-inner">
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
          <Terminal className="w-3 h-3 text-zinc-500" />
          <span className="text-xs text-zinc-500 font-medium">Console Output</span>
        </div>

        <div className="h-32 overflow-y-auto p-4 font-mono text-sm">
          {output.length === 0 ? (
            <span className="text-zinc-700 italic text-xs">Click "Run Code" to execute...</span>
          ) : (
            output.map((line, i) => (
              // Render empty lines as distinct divs to preserve spacing
              <div key={i} className={`${line.includes("Error") ? "text-red-400" : "text-zinc-300"}`}>
                {line === "" ? "\u00A0" : line}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}