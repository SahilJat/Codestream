import { spawn } from "child_process";

export function executeCode(language: string, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // We only support javascript for now, using the node image
    const dockerArgs = ["run", "--rm", "-i", "node:18-alpine", "node"];

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
        // If the process failed, we still want to return the stderr as "output"
        // for the user to see (e.g., syntax errors)
        resolve(stderr || "Unknown execution error");
      } else {
        resolve(stdout);
      }
    });
  });
}
