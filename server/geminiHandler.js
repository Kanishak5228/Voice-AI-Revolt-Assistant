const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function handleGeminiStream(audioBuffer, ws) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "audio/webm",
                data: audioBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    // removed redundant stream extraction

    for await (const chunk of result) {
      const aiText = chunk.text();
      if (aiText && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "aiResponseChunk", data: aiText }));
      }
    }
  } catch (error) {
    console.error("Gemini error:", error);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "aiResponseChunk", data: "Sorry, I couldn’t understand that." }));
    }
  }
}

module.exports = { handleGeminiStream };