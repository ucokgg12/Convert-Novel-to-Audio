
import { GoogleGenAI, Modality } from "@google/genai";

// =================================================================================
// Pre-configured API Key
// =================================================================================
const API_KEY = "AIzaSyBMyNXDBR75j0jjtW4uP2q9UQ4RBnI2C6M";
let ai;


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
let currentAudioBuffer = null;
let animationFrameId = null;

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
  if (!ai) {
    throw new Error("Gemini AI client is not initialized. Check API Key configuration.");
  }

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
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    currentAudioBuffer = null;
    playerContainer.innerHTML = '';
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function renderAudioPlayer(base64Audio, downloadUrl) {
    // Inject styles for the custom range input
    const styleId = 'custom-player-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .custom-seek-bar {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 8px;
                background: #4a5568; /* a darker gray */
                border-radius: 5px;
                outline: none;
                cursor: pointer;
            }
            .custom-seek-bar::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: #dd6b20; /* a nice orange */
                border-radius: 50%;
                cursor: pointer;
            }
            .custom-seek-bar::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #dd6b20;
                border-radius: 50%;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }
    
    playerContainer.innerHTML = `
        <div class="w-full flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg space-y-4 text-white">
            <div id="player-controls" class="w-full flex items-center space-x-4">
                <button id="play-pause-button" class="flex-shrink-0" aria-label="Play/Pause">
                    <svg id="play-icon" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 14.386A1.723 1.723 0 005.74 16.11l6.55-3.743a1.724 1.724 0 000-2.972L5.74 5.652A1.723 1.723 0 004.018 7.378v7.008z"></path></svg>
                    <svg id="pause-icon" class="w-6 h-6 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 4.5a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25a.75.75 0 00-.75-.75zm8.5 0a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25a.75.75 0 00-.75-.75z"></path></svg>
                </button>
                <div id="time-display" class="text-sm font-mono whitespace-nowrap">00:00 / 00:00</div>
                <input type="range" id="seek-bar" class="custom-seek-bar w-full" min="0" value="0" step="0.1">
                 <a id="download-link"
                  href="${downloadUrl}"
                  download="gemini-audio.mp3"
                  class="flex-shrink-0 text-gray-400 hover:text-white"
                  aria-label="Download audio">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </a>
            </div>
        </div>
    `;

    try {
        const decodedBytes = decode(base64Audio);
        currentAudioBuffer = await decodePcmAudioData(decodedBytes, audioContext);

        // Player state
        let isPlaying = false;
        let startOffset = 0;
        let playbackStartTime = 0;
        const duration = currentAudioBuffer.duration;

        // Player elements
        const playPauseButton = document.getElementById('play-pause-button');
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        const timeDisplay = document.getElementById('time-display');
        const seekBar = document.getElementById('seek-bar');

        // Initial setup
        seekBar.max = duration;
        timeDisplay.textContent = `00:00 / ${formatTime(duration)}`;

        const updateUI = () => {
            if (!isPlaying) return;
            const currentTime = startOffset + (audioContext.currentTime - playbackStartTime);

            // Player progress
            if (currentTime < duration) {
                seekBar.value = currentTime;
                timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
                animationFrameId = requestAnimationFrame(updateUI);
            } else {
                resetPlayerState();
            }
        };

        const resetPlayerState = () => {
             isPlaying = false;
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            startOffset = 0;
            seekBar.value = 0;
            timeDisplay.textContent = `00:00 / ${formatTime(duration)}`;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
        
        const play = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            currentSource = audioContext.createBufferSource();
            currentSource.buffer = currentAudioBuffer;
            currentSource.connect(audioContext.destination);
            
            playbackStartTime = audioContext.currentTime;
            currentSource.start(0, startOffset % duration);
            
            isPlaying = true;
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');

            currentSource.onended = () => {
                if(isPlaying){ 
                    resetPlayerState();
                }
            };
            
            animationFrameId = requestAnimationFrame(updateUI);
        };

        const pause = () => {
            if (!currentSource) return;
            currentSource.stop();
            startOffset += (audioContext.currentTime - playbackStartTime);
            
            isPlaying = false;
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        playPauseButton.addEventListener('click', () => {
            if (isPlaying) {
                pause();
            } else {
                play();
            }
        });
        
        seekBar.addEventListener('input', () => {
             if (isPlaying) {
                pause();
             }
             startOffset = parseFloat(seekBar.value);
             timeDisplay.textContent = `${formatTime(startOffset)} / ${formatTime(duration)}`;
        });

         seekBar.addEventListener('change', () => {
            if(!isPlaying){
                play();
            }
        });

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
        const errorMessage = e.message || String(e);
        if (errorMessage.includes('API key not valid')) {
            displayError('Authentication Error: The pre-configured API Key is not valid.');
        } else {
            displayError(`Failed to generate audio: ${errorMessage}`);
        }
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
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('ServiceWorker registration successful:', reg.scope))
                .catch(err => console.log('ServiceWorker registration failed:', err));
        });
    }

    // Add event listeners
    generateButton.addEventListener('click', handleGenerateAudio);

    // Initialize Gemini Client
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch (e) {
        console.error("Failed to initialize Gemini with the provided API Key:", e);
        displayError("Could not initialize the AI service. The API key might be malformed.");
        textInput.disabled = true;
        voiceSelect.disabled = true;
        generateButton.disabled = true;
    }
}

// Start the application
initializeApp();