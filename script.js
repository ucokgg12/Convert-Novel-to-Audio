// Initialize Lucide icons
lucide.createIcons();

// DOM Elements
const promptTextarea = document.getElementById('prompt');
const charCount = document.getElementById('charCount');
const generateBtn = document.getElementById('generateBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressPercentage = document.getElementById('progressPercentage');
const resultSection = document.getElementById('resultSection');
const resultVideo = document.getElementById('resultVideo');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const recentGrid = document.getElementById('recentGrid');

// Form elements
const styleSelect = document.getElementById('style');
const durationSelect = document.getElementById('duration');
const resolutionSelect = document.getElementById('resolution');
const framerateSelect = document.getElementById('framerate');

// Progress steps
const steps = ['step1', 'step2', 'step3', 'step4'];

// State
let isGenerating = false;
let currentGeneration = null;

// Sample video URLs (you can replace these with actual generated videos)
const sampleVideos = [
    'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
];

// Initialize the app
function init() {
    setupEventListeners();
    loadRecentGenerations();
    lucide.createIcons();
}

// Event Listeners
function setupEventListeners() {
    // Character counter
    promptTextarea.addEventListener('input', updateCharCount);
    
    // Generate button
    generateBtn.addEventListener('click', handleGenerate);
    
    // Action buttons
    downloadBtn.addEventListener('click', handleDownload);
    shareBtn.addEventListener('click', handleShare);
    regenerateBtn.addEventListener('click', handleRegenerate);
    
    // Form validation
    promptTextarea.addEventListener('input', validateForm);
}

// Update character count
function updateCharCount() {
    const count = promptTextarea.value.length;
    charCount.textContent = count;
    
    if (count > 400) {
        charCount.style.color = '#e53e3e';
    } else if (count > 300) {
        charCount.style.color = '#d69e2e';
    } else {
        charCount.style.color = '#718096';
    }
}

// Validate form
function validateForm() {
    const isValid = promptTextarea.value.trim().length > 10;
    generateBtn.disabled = !isValid || isGenerating;
}

// Handle video generation
async function handleGenerate() {
    if (isGenerating || !promptTextarea.value.trim()) return;
    
    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i data-lucide="loader-2"></i> Generating...';
    
    // Hide previous results
    resultSection.style.display = 'none';
    
    // Show progress section
    progressSection.style.display = 'block';
    progressSection.classList.add('fade-in');
    
    // Reset progress
    resetProgress();
    
    try {
        await simulateVideoGeneration();
        await showResult();
    } catch (error) {
        console.error('Generation failed:', error);
        alert('Failed to generate video. Please try again.');
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i data-lucide="play-circle"></i> Generate Video';
        lucide.createIcons();
    }
}

// Simulate video generation process
async function simulateVideoGeneration() {
    const totalSteps = 4;
    const stepDuration = 1500; // 1.5 seconds per step
    
    for (let i = 0; i < totalSteps; i++) {
        // Update step status
        if (i > 0) {
            document.getElementById(steps[i - 1]).classList.remove('active');
            document.getElementById(steps[i - 1]).classList.add('completed');
        }
        document.getElementById(steps[i]).classList.add('active');
        
        // Update progress bar
        const progress = ((i + 1) / totalSteps) * 100;
        progressFill.style.width = progress + '%';
        progressPercentage.textContent = Math.round(progress) + '%';
        
        // Wait for step completion
        await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    
    // Mark last step as completed
    document.getElementById(steps[totalSteps - 1]).classList.remove('active');
    document.getElementById(steps[totalSteps - 1]).classList.add('completed');
}

// Reset progress indicators
function resetProgress() {
    progressFill.style.width = '0%';
    progressPercentage.textContent = '0%';
    
    steps.forEach(stepId => {
        const step = document.getElementById(stepId);
        step.classList.remove('active', 'completed');
    });
    
    document.getElementById('step1').classList.add('active');
}

// Show generation result
async function showResult() {
    // Hide progress section
    progressSection.style.display = 'none';
    
    // Create generation data
    currentGeneration = {
        id: Date.now(),
        prompt: promptTextarea.value.trim(),
        style: styleSelect.value,
        duration: durationSelect.value,
        resolution: resolutionSelect.value,
        framerate: framerateSelect.value,
        timestamp: new Date().toLocaleString(),
        videoUrl: sampleVideos[Math.floor(Math.random() * sampleVideos.length)]
    };
    
    // Set video source
    resultVideo.src = currentGeneration.videoUrl;
    
    // Show result section
    resultSection.style.display = 'block';
    resultSection.classList.add('fade-in');
    
    // Save to recent generations
    saveToRecentGenerations(currentGeneration);
    
    // Update recent grid
    loadRecentGenerations();
}

// Handle download
function handleDownload() {
    if (!currentGeneration) return;
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = currentGeneration.videoUrl;
    link.download = `veo3-video-${currentGeneration.id}.mp4`;
    link.target = '_blank';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    showNotification('Download started!', 'success');
}

// Handle share
async function handleShare() {
    if (!currentGeneration) return;
    
    const shareData = {
        title: 'My AI Generated Video',
        text: `Check out this video I created with Veo 3: "${currentGeneration.prompt}"`,
        url: window.location.href
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            showNotification('Shared successfully!', 'success');
        } catch (error) {
            copyToClipboard(shareData.url);
        }
    } else {
        copyToClipboard(shareData.url);
    }
}

// Handle regenerate
function handleRegenerate() {
    if (isGenerating) return;
    
    // Keep the same prompt and settings
    handleGenerate();
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Link copied to clipboard!', 'success');
    } catch (error) {
        showNotification('Failed to copy link', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#4299e1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Save generation to local storage
function saveToRecentGenerations(generation) {
    let recent = getRecentGenerations();
    recent.unshift(generation);
    
    // Keep only the last 6 generations
    if (recent.length > 6) {
        recent = recent.slice(0, 6);
    }
    
    localStorage.setItem('veo3_recent', JSON.stringify(recent));
}

// Get recent generations from local storage
function getRecentGenerations() {
    try {
        const stored = localStorage.getItem('veo3_recent');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading recent generations:', error);
        return [];
    }
}

// Load and display recent generations
function loadRecentGenerations() {
    const recent = getRecentGenerations();
    
    if (recent.length === 0) {
        recentGrid.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7); grid-column: 1/-1;">No recent generations yet. Create your first video!</p>';
        return;
    }
    
    recentGrid.innerHTML = recent.map(generation => `
        <div class="recent-item">
            <video onclick="playVideo(this)" style="cursor: pointer;">
                <source src="${generation.videoUrl}" type="video/mp4">
            </video>
            <div class="recent-item-info">
                <div class="recent-item-prompt">${generation.prompt}</div>
                <div class="recent-item-meta">
                    <span>${generation.style} • ${generation.duration}s</span>
                    <span>${generation.timestamp}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Play video on click
function playVideo(video) {
    if (video.paused) {
        // Pause all other videos
        document.querySelectorAll('video').forEach(v => {
            if (v !== video) v.pause();
        });
        video.play();
    } else {
        video.pause();
    }
}

// Sample prompts for inspiration
const samplePrompts = [
    "A serene sunset over a mountain lake with gentle ripples on the water",
    "A bustling city street at night with neon lights reflecting on wet pavement",
    "A majestic eagle soaring over a vast canyon landscape",
    "Waves crashing against rocky cliffs during a dramatic storm",
    "A peaceful forest path with sunlight filtering through autumn leaves",
    "A modern glass building with clouds reflecting in its windows",
    "A vintage car driving down a desert highway at golden hour",
    "Cherry blossoms falling in a traditional Japanese garden"
];

// Add sample prompt functionality
function addSamplePromptButton() {
    const sampleBtn = document.createElement('button');
    sampleBtn.innerHTML = '<i data-lucide="lightbulb"></i> Get Inspiration';
    sampleBtn.className = 'action-btn secondary';
    sampleBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    `;
    
    // Make the input section relative positioned
    const inputSection = document.querySelector('.input-section');
    inputSection.style.position = 'relative';
    inputSection.appendChild(sampleBtn);
    
    sampleBtn.addEventListener('click', () => {
        const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
        promptTextarea.value = randomPrompt;
        updateCharCount();
        validateForm();
        lucide.createIcons();
    });
    
    lucide.createIcons();
}

// Add keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!isGenerating && promptTextarea.value.trim().length > 10) {
                handleGenerate();
            }
        }
        
        // Escape to stop generation (if implemented)
        if (e.key === 'Escape' && isGenerating) {
            // Could implement cancellation logic here
            console.log('Generation cancellation requested');
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    addSamplePromptButton();
    setupKeyboardShortcuts();
    
    // Initial validation
    validateForm();
    
    // Re-initialize Lucide icons after all elements are loaded
    setTimeout(() => {
        lucide.createIcons();
    }, 100);
});

// Handle window resize for responsive videos
window.addEventListener('resize', () => {
    // Ensure videos maintain aspect ratio
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (video.videoWidth && video.videoHeight) {
            const aspectRatio = video.videoHeight / video.videoWidth;
            video.style.height = (video.offsetWidth * aspectRatio) + 'px';
        }
    });
});

// Export functions for global use
window.playVideo = playVideo;
