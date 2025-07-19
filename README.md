# Voice AI Revolt Assistant 🚀
A real-time voice assistant that uses the Gemini API to answer questions related to Revolt Motors.

## 🔧 Features

- 🎙️ Voice input using browser mic
- 🧠 AI responses powered by Gemini Pro
- 📡 Real-time communication via WebSockets
- 🌐 Simple web interface

## 🛠️ Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Kanishak5228/Voice-AI-Revolt-Assistant.git
   cd Voice-AI-Revolt-Assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add your Gemini API key to a `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the server:
   ```bash
   node server/index.js
   ```

5. Open two terminal windows:
   - In Terminal 1, start the backend server:
     ```bash
     node server/index.js
     ```
   - In Terminal 2, expose the local server using ngrok:
     ```bash
     ngrok http 3000
     ```
   - Visit the forwarded ngrok URL in your browser to test the app securely with mic permissions.

> ⚠️ Requires an active Gemini API key with quota available. Use `ngrok` for proper mic permission handling in browsers.

## 📂 Project Structure

```
public/
├── index.html
├── app.js
└── styles.css

server/
├── index.js
├── websocket.js
└── geminiHandler.js
```

---