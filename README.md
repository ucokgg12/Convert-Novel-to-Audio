# Veo 3 - AI Video Generation Web App

A modern web application that simulates Google's Veo 3 AI video generation capabilities. This app provides a sleek interface for creating AI-generated videos from text descriptions.

## Features

🎬 **Text-to-Video Generation**
- Natural language prompts for video creation
- Multiple style options (Cinematic, Documentary, Anime, Realistic, Abstract)
- Customizable duration, resolution, and frame rate settings

🎨 **Modern UI/UX**
- Responsive design with glass morphism effects
- Smooth animations and transitions
- Progress tracking with visual indicators
- Real-time character counter

📱 **Interactive Elements**
- Video preview with controls
- Download and share functionality
- Recent generations gallery
- Sample prompt inspiration
- Keyboard shortcuts (Ctrl+Enter to generate)

⚡ **Performance Optimized**
- Lightweight vanilla JavaScript
- CSS Grid and Flexbox layouts
- Optimized for mobile and desktop

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Icons**: Lucide Icons
- **Build Tool**: Vite
- **Package Manager**: npm/pnpm

## Project Structure

```
veo3-webapp/
├── index.html          # Main HTML file
├── styles.css          # CSS styles with modern design
├── script.js           # JavaScript functionality
├── package.json        # Dependencies and scripts
└── README.md          # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or pnpm

### Installation

1. Clone or download this project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

### Development

To start the development server:
```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build for Production

To build the project for production:
```bash
npm run build
# or
pnpm build
```

To preview the production build:
```bash
npm run preview
# or
pnpm preview
```

## Usage

1. **Enter a Prompt**: Describe the video you want to generate in the text area
2. **Select Settings**: Choose style, duration, resolution, and frame rate
3. **Generate**: Click the "Generate Video" button or press Ctrl+Enter
4. **Watch Progress**: Monitor the generation process through visual steps
5. **View Result**: Preview your generated video
6. **Download/Share**: Save or share your creation

### Sample Prompts

Try these example prompts to get started:
- "A serene sunset over a mountain lake with gentle ripples on the water"
- "A bustling city street at night with neon lights reflecting on wet pavement"
- "Waves crashing against rocky cliffs during a dramatic storm"
- "A peaceful forest path with sunlight filtering through autumn leaves"

## Features in Detail

### Video Generation Simulation
- Realistic progress tracking with 4-step process
- Visual feedback for each generation phase
- Random video selection from sample pool

### User Interface
- **Glass Morphism Design**: Modern translucent elements with backdrop blur
- **Responsive Layout**: Adapts to all screen sizes
- **Interactive Animations**: Hover effects and smooth transitions
- **Accessibility**: Keyboard navigation and ARIA labels

### Local Storage
- Saves recent generations for quick access
- Maintains user preferences across sessions
- Automatic cleanup of old entries

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Generate video
- `Escape`: Cancel generation (placeholder for future feature)

## Customization

### Adding New Styles
Edit the style dropdown in `index.html`:
```html
<option value="new-style">New Style</option>
```

### Changing Sample Videos
Update the `sampleVideos` array in `script.js`:
```javascript
const sampleVideos = [
    'path/to/your/video1.mp4',
    'path/to/your/video2.mp4',
    // Add more videos
];
```

### Modifying UI Colors
Update CSS custom properties in `styles.css`:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --glass-bg: rgba(255, 255, 255, 0.95);
    --border-color: rgba(255, 255, 255, 0.2);
}
```

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Google's Veo 3 AI video generation model
- Icons provided by Lucide
- Modern design principles from contemporary AI tools

## Future Enhancements

- [ ] Real AI video generation integration
- [ ] User authentication and cloud storage
- [ ] Advanced editing capabilities
- [ ] Video timeline and keyframe control
- [ ] Batch processing
- [ ] API integration
- [ ] Social sharing features
- [ ] Video templates and presets

---

**Note**: This is a demonstration/simulation app. For actual AI video generation, you would need to integrate with real AI services like Google's Veo 3 API when available.
