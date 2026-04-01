require("dotenv").config();

const http = require("http");
const { execSync } = require("child_process");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db"); // Ket noi den co so du lieu
const { initializeChatSocket } = require("./modules/chat/chat.socket");
const { startAllCronJobs } = require("./services/cron.service");

const PORT = process.env.PORT || 5000;

// Ket noi co so du lieu
connectDB().then(() => {
  // Start cron jobs after DB is connected
  startAllCronJobs();
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});

initializeChatSocket(io);

function getListeningPidsOnPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      stdio: ["ignore", "pipe", "ignore"]
    }).toString();

    return Array.from(
      new Set(
        result
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => line.split(/\s+/).pop())
          .filter((pid) => /^\d+$/.test(pid))
      )
    );
  } catch {
    return [];
  }
}

function autoFreePortForDev(port) {
  const shouldAutoFree = process.env.AUTO_FREE_PORT !== "false";
  const isDev = process.env.NODE_ENV !== "production";
  const isWindows = process.platform === "win32";

  if (!shouldAutoFree || !isDev || !isWindows) {
    return;
  }

  const pids = getListeningPidsOnPort(port);
  if (!pids.length) {
    return;
  }

  pids.forEach((pid) => {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.warn(`⚠️ Freed port ${port} by stopping process PID ${pid}`);
    } catch {
      // Bo qua loi taskkill tung tien trinh de khong chan qua trinh khoi dong.
    }
  });
}

autoFreePortForDev(PORT);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend process or change PORT in backend/.env before starting a new server.`);
    process.exit(1);
  }

  console.error('Server startup error:', error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});