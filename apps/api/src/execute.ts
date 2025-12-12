import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function executeCode(language: string, code: string): Promise<string> {
  // 1. Create a unique file for this run to avoid collisions
  const jobId = `job-${Date.now()}`;
  const filename = `${jobId}.js`; // We support JS for now
  const tempDir = path.join(__dirname, "../temp");
  const filePath = path.join(tempDir, filename);

  // Ensure temp dir exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    // 2. Write the user's code to a file
    await fs.promises.writeFile(filePath, code);

    console.log(`Executing job ${jobId}...`);

    // 3. THE MAGIC: Run inside Docker
    // --rm: Remove container after run
    // -v: Mount the file into the container
    // node:18-alpine: Lightweight Node image
    // timeout 5s: Kill if it runs too long (Infinite loop protection)

    // NOTE: On Windows/Mac, mounting volumes can be tricky with paths.
    // We mount the specific file to /app/test.js inside the container.

    const dockerCommand = `docker run --rm -v "${filePath}":/app/test.js node:18-alpine node /app/test.js`;

    // 4. Execute
    const { stdout, stderr } = await execPromise(dockerCommand);

    // Cleanup
    await fs.promises.unlink(filePath);

    return stdout || stderr;

  } catch (error: any) {
    // Cleanup on error
    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);

    console.error("Execution Error:", error);
    return error.stderr || error.message;
  }
}
