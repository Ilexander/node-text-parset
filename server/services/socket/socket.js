const WebSocket = require("ws");
const { createWorker } = require("tesseract.js");

class WebSocketService {
  constructor() {
    this.worker = null;
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on("connection", (socket) => {
      this.handleConnection(socket);
    });
  }

  async handleConnection(socket) {
    if (socket.OPEN) {
      this.worker = await createWorker({
        logger: (m) => {
          if (m.status === "recognizing text")
            socket.send(this.sendJSON({ text: m.progress * 100 }));
        },
      });

      socket.on("close", () => {
        this.handleClose();
      });

      socket.on("message", (message) => {
        this.handleMessage(message, socket);
      });
    }

    console.log("WebSocket connected");
  }

  handleMessage(message, socket) {
    if (Buffer.isBuffer(message)) {
      const worker = this.worker;
      const messageUtf8 = message.toString("utf-8");
      const messageToObject = JSON.parse(messageUtf8);

      if (messageToObject.type === "image") {
        (async () => {
          await worker.loadLanguage("rus");
          await worker.initialize("rus");
          const {
            data: { text },
          } = await worker.recognize(messageToObject.body);
          socket.send(this.sendJSON({ text }));
        })();
      }
    }
  }

  handleClose() {
    console.log("Removing worker...");
    this.worker.terminate();
    console.log("Worker removed!");
  }

  sendJSON(json) {
    return JSON.stringify(json);
  }

  getSocket() {
    return this.wss;
  }
}

module.exports = WebSocketService;
