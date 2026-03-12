import { spawn } from "child_process";

export function executeCode(language: string, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let dockerArgs: string[] = [];

    switch (language) {
      case "javascript":
        dockerArgs = ["run", "--rm", "-i", "node:18-alpine", "node"];
        break;
      case "python":
        dockerArgs = ["run", "--rm", "-i", "python:3-alpine", "python"];
        break;
      case "cpp":
        // Write stdin to main.cpp, compile, and run
        dockerArgs = ["run", "--rm", "-i", "gcc:11", "sh", "-c", "cat > main.cpp && g++ main.cpp && ./a.out"];
        break;
      case "java":
        // Write stdin to Main.java, compile, and run
        dockerArgs = ["run", "--rm", "-i", "openjdk:17-alpine", "sh", "-c", "cat > Main.java && javac Main.java && java Main"];
        break;
      default:
        return reject(`Language ${language} is not supported.`);
    }

    const child = spawn("docker", dockerArgs);

    let stdout = "";
    let stderr = "";

    // Send code to stdin
    child.stdin.write(code);
    child.stdin.end();

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      console.error("Execution Spawn Error:", error);
      reject(error.message);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        // Return stderr or stdout if it failed
        resolve(stderr || stdout || "Unknown execution error");
      } else {
        resolve(stdout);
      }
    });
  });
}