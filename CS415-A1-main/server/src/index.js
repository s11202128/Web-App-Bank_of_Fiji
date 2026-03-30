const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

function loadEnvFromFile() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFromFile();

const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");
const initializeDatabase = require("./database");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "bof-dev-secret-2026";
let ioRef = null;

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function shouldBroadcastActivity(req, res) {
  if (!req.path.startsWith("/api")) {
    return false;
  }
  if (!MUTATION_METHODS.has(String(req.method || "").toUpperCase())) {
    return false;
  }
  if (res.statusCode >= 400) {
    return false;
  }
  if (req.path.startsWith("/api/auth/")) {
    return false;
  }
  return true;
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    if (!ioRef || !shouldBroadcastActivity(req, res)) {
      return;
    }

    ioRef.emit("activity:changed", {
      method: req.method,
      path: req.path,
      at: new Date().toISOString(),
    });
  });

  next();
});

app.use("/api", authRoutes);
app.use("/api", apiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: true,
        credentials: true,
      },
    });
    ioRef = io;

    io.use((socket, next) => {
      const token = String(socket.handshake?.auth?.token || "");
      if (!token) {
        return next(new Error("Authentication required"));
      }
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = {
          userId: Number(decoded.userId),
          isAdmin: Boolean(decoded.isAdmin),
          email: decoded.email,
        };
        return next();
      } catch (error) {
        return next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      const user = socket.user || {};
      if (user.isAdmin) {
        socket.join("admin");
      }
      if (Number.isFinite(user.userId) && user.userId > 0) {
        socket.join(`customer:${user.userId}`);
      }
    });

    server.on("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        console.warn(
          `Port ${PORT} is already in use. Another backend instance is likely already running.`
        );
        console.warn("Keeping nodemon alive for file changes instead of crashing.");
        return;
      }

      console.error("Failed to start HTTP server:", error);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`BoF Banking API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
