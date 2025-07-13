# Prompt Refinement App

A sophisticated web application that helps users refine their prompts through an intelligent question-and-answer process. The app takes a user's initial, general prompt and uses LLM providers to generate targeted yes/no questions that progressively refine the prompt into a more specific, effective version.

## 🚀 Features

- **Multi-LLM Support**: Works with OpenAI, Anthropic Claude, Google AI, and Ollama
- **Interactive Refinement**: Step-by-step prompt improvement through targeted questions
- **Real-time Preview**: See your prompt evolve as you answer questions
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Session Management**: Temporary sessions that automatically expire
- **Provider Selection**: Choose your preferred LLM provider and model

## 🛠️ Tech Stack

### Backend

- **Node.js** with **Express.js** and **TypeScript**
- **Multiple LLM Providers**: OpenAI, Anthropic, Google AI, Ollama
- **Zod** for validation
- **In-memory session storage**

### Frontend

- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for state management
- **Zustand** for client state

## 📋 Prerequisites

- Node.js 18 or higher
- At least one LLM provider API key:
  - OpenAI API key
  - Anthropic API key
  - Google AI API key
  - Or local Ollama installation

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd prompt-refinement-app
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend` directory (use `env.example` as a template):

   ```bash
   cd ../backend
   cp env.example .env
   ```

   Edit the `.env` file with your API keys:

   ```env
   # Server Configuration
   PORT=8000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000

   # LLM Provider API Keys (add at least one)
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
   GOOGLE_API_KEY=your-google-ai-api-key-here
   OLLAMA_BASE_URL=http://localhost:11434
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**

   ```bash
   cd backend
   npm run dev
   ```

   The backend will run on `http://localhost:8000`

2. **Start the frontend development server**

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

### Production Build

1. **Build the backend**

   ```bash
   cd backend
   npm run build
   ```

2. **Build the frontend**

   ```bash
   cd frontend
   npm run build
   ```

3. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

## 🎯 Usage

1. **Enter your initial prompt** - Start with a general prompt you want to refine
2. **Select your LLM provider** - Choose from available providers (OpenAI, Anthropic, etc.)
3. **Answer targeted questions** - The AI will ask 5-7 yes/no questions to understand your needs
4. **Get your refined prompt** - Receive a more specific, effective version of your original prompt
5. **Copy and use** - Copy the refined prompt for use in your preferred AI tool

## 🔑 API Endpoints

### Prompts

- `POST /api/prompts/create-session` - Create a new refinement session
- `GET /api/prompts/session/:id` - Get session details
- `POST /api/prompts/refine` - Refine the prompt based on answers
- `POST /api/prompts/answer-question` - Answer a specific question

### Providers

- `GET /api/providers` - Get available LLM providers
- `POST /api/providers/validate-key` - Validate an API key

### Questions

- `POST /api/questions/generate` - Generate questions for a prompt

## 🧪 Testing

You can test the API endpoints using curl or any HTTP client:

```bash
# Health check
curl http://localhost:8000/health

# Get available providers
curl http://localhost:8000/api/providers

# Create a session (requires valid API key)
curl -X POST http://localhost:8000/api/prompts/create-session \
  -H "Content-Type: application/json" \
  -d '{"originalPrompt": "Write a blog post about AI", "llmProvider": "openai"}'
```

## 🔒 Security

- API keys are never logged or exposed
- Sessions expire automatically after 24 hours
- No persistent storage of user prompts
- Rate limiting on API endpoints
- Input validation and sanitization

## 🚨 Troubleshooting

### Common Issues

1. **"No providers available"**

   - Check that you have at least one valid API key in your `.env` file
   - Verify the API key format is correct

2. **"Network Error"**

   - Ensure the backend server is running on port 8000
   - Check CORS settings if accessing from a different port

3. **"Session not found"**
   - Sessions expire after 24 hours
   - Create a new session if the old one has expired

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please create an issue in the repository.

---

**Happy Prompting!** 🎉
