

const WebSocket = require("ws");
const { handleGeminiStream } = require("./geminiHandler");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    let audioChunks = [];

    ws.on("message", async (data) => {
      if (data.toString().startsWith("{")) {
        const message = JSON.parse(data.toString());
        if (message.event === "stop") {
          if (audioChunks.length > 0) {
            await handleGeminiStream(Buffer.concat(audioChunks), ws);
            audioChunks = [];
          } else {
            console.warn("No audio data received before stop event.");
          }
        }
      } else {
        audioChunks.push(data);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}

module.exports = setupWebSocket;