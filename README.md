# Drawing Whiteboard MVP with AI Analysis

A web-based drawing whiteboard application with AI-powered content analysis using OpenAI's GPT-4 Vision API.

## Features

### Core Drawing Functionality
- **Full-page HTML5 Canvas** for freehand drawing
- **Drawing Tools**:
  - Pen/pencil tool with adjustable stroke width (1-20px)
  - Color picker for different pen colors
  - Eraser tool
  - Clear canvas button
- **Touch Support** for mobile devices
- **Undo/Redo** functionality (up to 50 operations)
- **Responsive Design** that works on desktop and mobile

### AI Analysis Features
- **Rectangular Selection** tool for choosing areas to analyze
- **Visual Feedback** with dashed selection rectangle
- **OpenAI GPT-4 Vision Integration** for content analysis
- **Draggable Result Cards** that display:
  - AI-generated summary of the selected content
  - Relevant web links for further learning
  - Easy-to-use close button

## Setup Instructions

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Run the Application
1. Open `index.html` in a modern web browser
2. When prompted, enter your OpenAI API key
3. The key will be stored locally in your browser

### 3. Usage
1. **Drawing**: Select pen tool and draw on the canvas
2. **Eraser**: Switch to eraser tool to remove content
3. **AI Analysis**: 
   - Click "AI Analyze" button
   - Click and drag to select an area on the canvas
   - Wait for AI analysis to complete
   - View results in the draggable card

## Technical Details

### Technologies Used
- **HTML5 Canvas API** for drawing functionality
- **Vanilla JavaScript** (ES6+) for application logic
- **CSS3** for styling and responsive design
- **OpenAI GPT-4 Vision API** for AI analysis
- **Fetch API** for HTTP requests

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### File Structure
```
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript application logic
└── README.md           # This file
```

## API Usage

The application uses OpenAI's GPT-4 Vision API to analyze selected canvas areas. Each analysis request:
- Extracts the selected canvas area as a PNG image
- Sends the image to OpenAI's API
- Requests a summary and relevant web links
- Displays results in a user-friendly format

**Cost**: Each analysis uses approximately 1,000 tokens (~$0.01-0.03 per analysis)

## Security Notes

- API keys are stored in browser localStorage
- No data is sent to external servers except OpenAI
- Canvas content remains local until analysis is requested
- API key is only transmitted to OpenAI's secure endpoints

## Customization

### Adding New Drawing Tools
1. Add tool button to HTML toolbar
2. Implement tool logic in `setTool()` method
3. Add tool-specific drawing behavior

### Modifying AI Prompts
Edit the prompt in the `callOpenAI()` method in `script.js`:
```javascript
text: 'Your custom prompt here...'
```

### Styling Changes
Modify `styles.css` to change:
- Color scheme
- Toolbar layout
- Result card appearance
- Responsive breakpoints

## Troubleshooting

### Common Issues
1. **API Key Not Working**: Ensure key starts with `sk-` and has sufficient credits
2. **Canvas Not Drawing**: Check browser compatibility and JavaScript console
3. **AI Analysis Fails**: Verify internet connection and API key validity
4. **Mobile Issues**: Ensure touch events are enabled in browser settings

### Browser Console
Open browser developer tools (F12) to view any error messages or debug information.

## Future Enhancements

Potential improvements for future versions:
- Multiple canvas layers
- Shape drawing tools (rectangles, circles, lines)
- Text input tool
- Export/import functionality
- Collaborative drawing
- Custom AI model integration
- Offline mode with local AI

## License

This project is open source and available under the MIT License.
