import { GoogleGenAI, Modality } from "@google/genai";

// =================================================================================
// Constants
// =================================================================================
const VOICES = [
  { id: 'Zephyr', name: 'Zephyr', description: 'American Female' },
  { id: 'Puck', name: 'Puck', description: 'British Male' },
  { id: 'Kore', name: 'Kore', description: 'Korean Female' },
  { id: 'Charon', name: 'Charon', description: 'German Male' },
  { id: 'Fenrir', name: 'Fenrir', description: 'American Male' },
];

// =================================================================================
// DOM Element Selection
// =================================================================================
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const generateButton = document.getElementById('generate-button');
const spinner = document.getElementById('spinner');
const buttonText = document.getElementById('button-text');
const errorContainer = document.getElementById('error-container');
const playerContainer = document.getElementById('player-container');

// =================================================================================
// State Variables
// =================================================================================
let isLoading = false;
let currentDownloadUrl = null;
let audioContext = null;
let currentSource = null;
let isPlaying = false;
let currentAudioBuffer = null;

// =================================================================================
// Audio Helper Functions
// =================================================================================

function decode(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodePcmAudioData(data, ctx) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000); // 1 channel, 24000 sample rate

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

function createMp3Blob(base64Pcm) {
  const pcmData = decode(base64Pcm);
  const pcmInt16 = new Int16Array(pcmData.buffer);

  const mp3encoder = new lamejs.Mp3Encoder(1, 24000, 128); // Mono, 24kHz, 128kbps
  const mp3Data = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < pcmInt16.length; i += sampleBlockSize) {
    const sampleChunk = pcmInt16.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mpeg' });
}


// =================================================================================
// Gemini Service
// =================================================================================
async function generateSpeech(text, voiceName) {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("No audio data received from API.");
  }

  return base64Audio;
}


// =================================================================================
// UI and Player Logic
// =================================================================================

function setButtonLoading(loading) {
    isLoading = loading;
    textInput.disabled = loading;
    voiceSelect.disabled = loading;
    generateButton.disabled = loading;
    if (loading) {
        spinner.classList.remove('hidden');
        buttonText.textContent = 'Generating...';
    } else {
        spinner.classList.add('hidden');
        buttonText.textContent = 'Generate Audio';
    }
}

function displayError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
}

function clearError() {
    errorContainer.classList.add('hidden');
}

function cleanupAudio() {
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
    if (currentDownloadUrl) {
        URL.revokeObjectURL(currentDownloadUrl);
        currentDownloadUrl = null;
    }
    isPlaying = false;
    currentAudioBuffer = null;
    playerContainer.innerHTML = '';
}

async function togglePlay(playButton, playIcon, stopIcon) {
    if (!currentAudioBuffer) return;

    if (isPlaying) {
        currentSource?.stop();
        isPlaying = false;
        playIcon.classList.remove('hidden');
        stopIcon.classList.add('hidden');
    } else {
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        const source = audioContext.createBufferSource();
        source.buffer = currentAudioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
            isPlaying = false;
            currentSource = null;
            playIcon.classList.remove('hidden');
            stopIcon.classList.add('hidden');
        };
        source.start();
        currentSource = source;
        isPlaying = true;
        playIcon.classList.add('hidden');
        stopIcon.classList.remove('hidden');
    }
}

async function renderAudioPlayer(base64Audio, downloadUrl) {
    playerContainer.innerHTML = `
        <div class="w-full flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg space-y-4">
            <h3 class="font-semibold text-gray-700">Generated Speech</h3>
            <div id="player-controls" class="flex items-center space-x-4">
                <p class="text-center text-gray-500">Processing audio...</p>
            </div>
        </div>
    `;

    try {
        const decodedBytes = decode(base64Audio);
        currentAudioBuffer = await decodePcmAudioData(decodedBytes, audioContext);

        const playerControls = document.getElementById('player-controls');
        playerControls.innerHTML = `
            <button id="play-button"
                class="flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-full text-white shadow-lg transform hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-white"
                aria-label="Play">
                <svg id="play-icon" class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
                <svg id="stop-icon" class="w-8 h-8 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M5 8c0-1.1.9-2 2-2h6a2 2 0 012 2v4a2 2 0 01-2 2H7a2 2 0 01-2-2V8z"></path></svg>
            </button>
            <a id="download-link"
              href="${downloadUrl}"
              download="gemini-audio.mp3"
              class="flex items-center justify-center w-16 h-16 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 shadow-lg transform hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white"
              aria-label="Download audio">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </a>
        `;
        
        const playButton = document.getElementById('play-button');
        const playIcon = document.getElementById('play-icon');
        const stopIcon = document.getElementById('stop-icon');
        playButton.addEventListener('click', () => togglePlay(playButton, playIcon, stopIcon));

    } catch (e) {
        console.error("Failed to decode audio:", e);
        displayError("Failed to decode or render audio player.");
        playerContainer.innerHTML = '';
    }
}


// =================================================================================
// Main Application Logic
// =================================================================================

async function handleGenerateAudio() {
    const text = textInput.value;
    const voice = voiceSelect.value;
    
    if (!text.trim()) {
        displayError('Please enter some text to generate audio.');
        return;
    }
    
    setButtonLoading(true);
    clearError();
    cleanupAudio();

    try {
        const generatedAudio = await generateSpeech(text, voice);
        
        const mp3Blob = createMp3Blob(generatedAudio);
        currentDownloadUrl = URL.createObjectURL(mp3Blob);

        await renderAudioPlayer(generatedAudio, currentDownloadUrl);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        displayError(`Failed to generate audio: ${errorMessage}`);
        console.error(e);
    } finally {
        setButtonLoading(false);
    }
}

function initializeApp() {
    // Populate voice options
    VOICES.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.name} - ${voice.description}`;
        voiceSelect.appendChild(option);
    });

    // Initialize Audio Context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        audioContext = new AudioContext({ sampleRate: 24000 });
    } else {
        displayError("Web Audio API is not supported in this browser.");
        generateButton.disabled = true;
    }
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }


    // Add event listeners
    generateButton.addEventListener('click', handleGenerateAudio);
}

// Start the application
initializeApp();
