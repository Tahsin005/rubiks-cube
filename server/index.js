import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { setupWsServer } from "./src/ws/wsServer.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
setupWsServer(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});