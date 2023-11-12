const port = 3000;
const { createServer } = require("http");
const WebSocketService = require("./server/services/socket/socket.js");

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const SocketService = new WebSocketService();

server.on("upgrade", (request, socket, head) => {
  const wss = SocketService.getSocket();

  const pathname = request.url;

  if (pathname === "/host/socket") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("close", ws, request);
      wss.close();
    });
  }
});

server.listen(port, () => {
  console.log("Server is listening on port 3000");
});