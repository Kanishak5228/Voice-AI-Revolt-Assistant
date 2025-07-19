const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const aiOrb = document.getElementById('ai-orb');
const chatWindow = document.getElementById('chat-window');
const userTranscriptDiv = document.getElementById('user-transcript');

let ws;
let mediaRecorder;
let currentAiMessageElement = null;

function setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('WebSocket connection opened.');
    ws.onclose = () => console.log('WebSocket connection closed.');
    ws.onerror = (error) => console.error('WebSocket error:', error);

    ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'userTranscript':
                userTranscriptDiv.textContent = message.data;
                break;
            case 'aiResponseChunk':
                if (!currentAiMessageElement) {
                    currentAiMessageElement = createMessageElement('ai-message');
                }
                currentAiMessageElement.textContent += message.data;
                chatWindow.scrollTop = chatWindow.scrollHeight;
                break;
            case 'finalUserTranscript':
                userTranscriptDiv.textContent = message.data;
                break;
        }
    };
}

function createMessageElement(className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${className}`;
    chatWindow.appendChild(messageDiv);
    return messageDiv;
}

async function startRecording() {
    try {
        currentAiMessageElement = null;
        userTranscriptDiv.textContent = '';
        aiOrb.classList.add('listening');

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === ws.OPEN) {
                ws.send(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ event: 'stop' }));
            }
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start(300);
        startButton.disabled = true;
        stopButton.disabled = false;

    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    aiOrb.classList.remove('listening');
    stopButton.disabled = true;
    startButton.disabled = false;
}

startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);

setupWebSocket();