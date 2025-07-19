const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('GEMINI_API_KEY is not defined.');

const MODEL_NAME = 'models/gemini-1.5-flash';

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

wss.on('connection', async (ws) => {
  console.log('Client connected.');
  let chat;
  let audioChunks = [];

  try {
    chat = model.startChat({
      systemInstruction: {
        role: "system",
        parts: [{
          text: "You are a helpful assistant for Revolt Motors. Only respond to questions about Revolt bikes, services, dealers, and products. Politely decline anything unrelated."
        }]
      }
    });
    console.log("Gemini chat session started.");

    ws.on('message', async (message) => {
      try {
        let isStopEvent = false;
        try {
          if (JSON.parse(message.toString()).event === 'stop') isStopEvent = true;
        } catch (e) { /* Must be audio */ }

        if (isStopEvent) {
          if (audioChunks.length === 0) return;
          const fullAudioBuffer = Buffer.concat(audioChunks);
          audioChunks = [];

          const audioPart = { inlineData: { data: fullAudioBuffer.toString("base64"), mimeType: "audio/webm" } };
          const result = await chat.sendMessageStream([audioPart]);

          let finalUserTranscript = "";
          for await (const chunk of result.stream) {
            if (chunk.speechRecognitionResult && chunk.speechRecognitionResult.text) {
              const userTranscript = chunk.speechRecognitionResult.text;
              finalUserTranscript += userTranscript;
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'interimUserTranscript', data: userTranscript }));
              }
            }
            
            const aiTextChunk = chunk.text();
            if (aiTextChunk) {
               if (ws.readyState === ws.OPEN) {
                 ws.send(JSON.stringify({ type: 'aiResponseChunk', data: aiTextChunk }));
               }
            }
          }

          if (finalUserTranscript && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'finalUserTranscript', data: finalUserTranscript }));
          }

        } else {
          audioChunks.push(message);
        }
      } catch (error) { console.error('Error during message processing:', error.message); }
    });

    ws.on('close', () => console.log('Client disconnected.'));
    ws.onerror = (error) => console.error('WebSocket Error:', error);
  } catch (error) {
    console.error('Failed to start Gemini chat session:', error);
    ws.close();
  }
});

server.listen(PORT, () => console.log(`Server is listening on http://localhost:${PORT}`));