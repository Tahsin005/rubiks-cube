import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { setupWsServer } from "./src/ws/wsServer.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = setupWsServer(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// drop WS connections immediately after server close
const terminateConnections = () => {
    if (wss && wss.clients) {
        wss.clients.forEach((client) => {
            client.terminate();
        });
    }
};

process.once("SIGUSR2", () => {
    terminateConnections();
    server.close(() => {
        process.kill(process.pid, "SIGUSR2");
    });
});

const shutdown = () => {
    terminateConnections();
    server.close(() => {
        process.exit(0);
    });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);