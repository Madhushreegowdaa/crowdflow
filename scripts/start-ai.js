import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const venvPythonWin = path.join(rootDir, 'ai-engine', '.venv', 'Scripts', 'python.exe');
const venvPythonPosix = path.join(rootDir, 'ai-engine', '.venv', 'bin', 'python');

let pythonBin = 'python';
if (isWindows && fs.existsSync(venvPythonWin)) {
  pythonBin = venvPythonWin;
} else if (fs.existsSync(venvPythonPosix)) {
  pythonBin = venvPythonPosix;
}

const uvicornArgs = [
  '-m', 'uvicorn', 'main:app',
  '--app-dir', path.join(rootDir, 'ai-engine'),
  '--reload',
  '--host', '127.0.0.1',
  '--port', '8000'
];

console.log(`[AI Startup] Launching FastAPI AI engine using: ${pythonBin}`);

const child = spawn(pythonBin, uvicornArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWindows
});

child.on('error', (err) => {
  console.error('[AI Startup] Failed to start Python process:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
