# 🐛 Debug Guide for Meeting Summary Assistant

## ✅ Build Status
- **Build**: ✅ Successful (`npm run build`)
- **Dev Server**: ✅ Running on http://localhost:3000
- **Linting**: ⚠️ Minor warnings (non-blocking)

## 🚀 Quick Start Debugging

### 1. **Development Server**
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 2. **Production Build**
```bash
npm run build
npm start
```

### 3. **Environment Setup**
Make sure you have a `.env` file with:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 🔧 Debugging Tools & Techniques

### **Browser DevTools**
1. **Console Logs**: Check for JavaScript errors and API responses
2. **Network Tab**: Monitor API calls to `/api/*` endpoints
3. **React DevTools**: Inspect component state and props

### **Key Components to Debug**

#### **VoiceAgent Component** (`src/components/VoiceAgent.tsx`)
- **State Variables**: 
  - `isConnected`, `transcript`, `summary`, `diagram`
  - `isGeneratingSummary`, `isGeneratingDiagram`
- **API Calls**: 
  - `/api/realtime-token` - Voice session setup
  - `/api/summarize` - Summary generation
  - `/api/generate-diagram` - Diagram generation
  - `/api/generate-mvp-prompt` - MVP prompt generation

#### **API Endpoints** (`src/app/api/`)
- **realtime-token**: OpenAI Realtime API token generation
- **summarize**: Meeting summary with different types
- **generate-diagram**: Mermaid diagram generation
- **generate-mvp-prompt**: Cursor development prompts

## 🐛 Common Issues & Solutions

### **1. Voice Connection Issues**
**Symptoms**: "Failed to establish connection" error
**Debug Steps**:
```javascript
// Check browser console for:
console.log('Token response:', data);
console.log('Connection error:', error);
```
**Solutions**:
- Verify OPENAI_API_KEY in `.env`
- Check browser microphone permissions
- Test with different browsers (Chrome recommended)

### **2. Summary Generation Fails**
**Symptoms**: "Failed to generate summary" error
**Debug Steps**:
```javascript
// Check API response in Network tab
// Look for 400/500 errors on /api/summarize
```
**Solutions**:
- Ensure transcript has >50 characters
- Check OpenAI API key validity
- Verify meeting type is selected

### **3. Diagram Rendering Issues**
**Symptoms**: "Failed to render diagram" or blank diagram area
**Debug Steps**:
```javascript
// Check Mermaid syntax in console
console.log('Diagram code:', diagramCode);
console.log('Mermaid error:', mermaidError);
```
**Solutions**:
- Check generated Mermaid syntax validity
- Test diagram code at https://mermaid.live
- Ensure transcript has >100 characters

### **4. MVP Prompt Generation Issues**
**Symptoms**: "Error: Failed to generate MVP prompt"
**Debug Steps**:
- Check if both summary and diagram exist
- Monitor `/api/generate-mvp-prompt` in Network tab
**Solutions**:
- Complete a full meeting session first
- Ensure summary and diagram are generated

## 📊 Monitoring & Logging

### **Console Logging**
Key log messages to watch for:
```javascript
// Connection status
"Generating diagram with context:"
"Mermaid rendering successful"
"Auto-triggering diagram generation after summary"

// Errors
"Connection error:"
"Failed to generate summary"
"Mermaid rendering error:"
```

### **Network Monitoring**
Monitor these API endpoints:
- `POST /api/realtime-token` - Should return `client_secret`
- `POST /api/summarize` - Should return `{summary, meetingType}`
- `POST /api/generate-diagram` - Should return `{diagram}`
- `POST /api/generate-mvp-prompt` - Should return `{prompt}`

## 🔍 Step-by-Step Debugging Process

### **1. Basic Functionality Test**
1. Open http://localhost:3000
2. Click "Start Voice Session"
3. Check console for connection logs
4. Speak for 10+ seconds
5. Verify transcript appears
6. Wait 3 seconds for summary
7. Check diagram generation

### **2. API Testing**
Test individual endpoints:
```bash
# Test summarize endpoint
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"transcript":"This is a test meeting about building a React app","meetingType":"general"}'

# Test diagram endpoint
curl -X POST http://localhost:3000/api/generate-diagram \
  -H "Content-Type: application/json" \
  -d '{"transcript":"We need to build a React app with Node.js backend"}'
```

### **3. Component State Debugging**
Add temporary logging in VoiceAgent.tsx:
```javascript
// Add after state declarations
useEffect(() => {
  console.log('State update:', {
    isConnected,
    transcript: transcript.slice(0, 50) + '...',
    summary: summary.slice(0, 50) + '...',
    diagram: !!diagram,
    isGeneratingSummary,
    isGeneratingDiagram
  });
}, [isConnected, transcript, summary, diagram, isGeneratingSummary, isGeneratingDiagram]);
```

## 🚨 Error Codes & Meanings

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 400 | Bad Request | Check request payload format |
| 401 | Unauthorized | Verify OpenAI API key |
| 500 | Server Error | Check server logs and API key |
| Network Error | Connection Issue | Check internet/server status |

## 📱 Browser Compatibility

**Recommended**: Chrome/Edge (best WebRTC support)
**Supported**: Firefox, Safari
**Issues**: Older browsers may have WebRTC problems

## 🔧 Development Tools

### **Useful Browser Extensions**
- React Developer Tools
- Redux DevTools (if using Redux)
- Network Monitor extensions

### **VS Code Extensions**
- ES7+ React/Redux/React-Native snippets
- TypeScript Hero
- Prettier - Code formatter
- ESLint

## 📞 Getting Help

### **Check These First**
1. Browser console errors
2. Network tab for failed API calls
3. Server terminal for backend errors
4. Environment variables are set

### **Debug Information to Collect**
- Browser and version
- Error messages (full text)
- Network requests/responses
- Console logs
- Steps to reproduce

## 🎯 Performance Monitoring

### **Key Metrics**
- Voice connection time: <5 seconds
- Summary generation: 3-10 seconds
- Diagram generation: 5-15 seconds
- MVP prompt generation: 10-20 seconds

### **Optimization Tips**
- Use Chrome for best performance
- Ensure stable internet connection
- Monitor API rate limits
- Check for memory leaks in long sessions

---

## 🚀 Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint

# Debugging
curl http://localhost:3000/api/health  # Health check (if implemented)
tail -f .next/trace                    # Monitor Next.js traces
```

Happy debugging! 🎉
