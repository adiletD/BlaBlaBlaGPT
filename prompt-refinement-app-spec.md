# Prompt Refinement App - Project Specification

## Project Overview

Build a sophisticated web application that helps users refine their prompts through an intelligent question-and-answer process. The app takes a user's initial, general prompt and uses an LLM to generate targeted yes/no questions that progressively refine the prompt into a more specific, effective version.

## Core Value Proposition

Transform vague, general prompts into precise, actionable ones through guided refinement, making AI interactions more effective for users of all skill levels.

## Technical Stack

### Frontend

- **React 18+** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for state management and API calls
- **React Hook Form** for form handling
- **Lucide React** for icons

### Backend

- **Node.js** with **Express.js**
- **TypeScript** throughout
- **Multiple LLM Provider Support** (OpenAI, Anthropic, Google AI, etc.)
- **Zod** for validation
- **Rate limiting** and **CORS** middleware
- **In-memory session storage** (no database persistence)

### Development Tools

- **ESLint** + **Prettier** for code formatting
- **Husky** for git hooks
- **Docker** for containerization
- **GitHub Actions** for CI/CD

## Core Features

### 1. Prompt Input & Initial Processing

- Clean, focused input interface for initial prompt
- Real-time character count and basic validation
- Support for different prompt types (creative, analytical, instructional)
- Save draft functionality

### 2. Intelligent Question Generation

- LLM-powered question generation based on initial prompt
- Context-aware questions that build upon previous answers
- Dynamic question prioritization
- Support for 5-10 questions per refinement cycle

### 3. Interactive Refinement Process

- Intuitive yes/no interface with visual feedback
- Progress tracking with completion percentage
- Ability to go back and modify previous answers
- Real-time prompt preview updates

### 4. Refined Prompt Display

- Side-by-side comparison of original vs refined prompt
- Copy-to-clipboard functionality
- Export options (text, JSON, markdown)
- Refinement history tracking

### 5. User Experience Enhancements

- Onboarding flow with examples
- Prompt templates for common use cases
- Refinement analytics and insights
- Shareable refinement sessions

## User Flow

### Primary Flow

1. **Landing Page**: User enters initial prompt
2. **Processing**: System generates targeted questions
3. **Refinement**: User answers yes/no questions sequentially
4. **Preview**: Real-time updated prompt preview
5. **Results**: Final refined prompt with comparison view
6. **Export**: Copy, save, or share refined prompt

### Secondary Flows

- **Template Selection**: Choose from pre-built prompt templates
- **History Review**: View and reuse previous refinements
- **Advanced Settings**: Configure refinement parameters

## API Design

### Core Endpoints

```typescript
// Prompt refinement endpoints
POST /api/prompts/refine
POST /api/prompts/create-session
GET /api/prompts/session/:sessionId

// Question generation
POST /api/questions/generate
POST /api/questions/answer

// LLM Provider management
GET /api/providers
POST /api/providers/validate-key

// Templates (static/predefined)
GET /api/templates
```

### Data Models

```typescript
interface RefinementSession {
  id: string
  originalPrompt: string
  refinedPrompt: string
  status: 'draft' | 'refining' | 'completed'
  createdAt: Date
  updatedAt: Date
  llmProvider: string
  questions: Question[]
  answers: Answer[]
  expiresAt: Date // Session expires after 24 hours
}

interface Question {
  id: string
  text: string
  order: number
  category: 'clarity' | 'specificity' | 'context' | 'constraints'
  impact: 'high' | 'medium' | 'low'
  explanation?: string
}

interface Answer {
  id: string
  questionId: string
  response: boolean
  timestamp: Date
}

interface LLMProvider {
  id: string
  name: string
  displayName: string
  apiKeyName: string
  baseUrl?: string
  supportedModels: string[]
  isEnabled: boolean
}
```

## LLM Provider Architecture

### Provider Interface

```typescript
interface ILLMProvider {
  readonly id: string
  readonly name: string
  readonly displayName: string
  readonly supportedModels: string[]

  validateApiKey(apiKey: string): Promise<boolean>
  generateQuestions(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Question[]>
  refinePrompt(
    originalPrompt: string,
    questions: Question[],
    answers: Answer[],
    options?: RefinementOptions
  ): Promise<string>
}

interface GenerationOptions {
  model?: string
  maxQuestions?: number
  temperature?: number
  categories?: string[]
}

interface RefinementOptions {
  model?: string
  temperature?: number
  explainChanges?: boolean
}
```

### Supported Providers

```typescript
enum LLMProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OLLAMA = 'ollama',
  CUSTOM = 'custom',
}

const PROVIDER_CONFIGS: Record<LLMProviderType, LLMProvider> = {
  [LLMProviderType.OPENAI]: {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    apiKeyName: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    isEnabled: true,
  },
  [LLMProviderType.ANTHROPIC]: {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    apiKeyName: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    supportedModels: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
    isEnabled: true,
  },
  [LLMProviderType.GOOGLE]: {
    id: 'google',
    name: 'google',
    displayName: 'Google AI',
    apiKeyName: 'GOOGLE_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    supportedModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    isEnabled: true,
  },
  [LLMProviderType.OLLAMA]: {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama (Local)',
    apiKeyName: 'OLLAMA_BASE_URL',
    baseUrl: 'http://localhost:11434',
    supportedModels: ['llama2', 'codellama', 'mistral'],
    isEnabled: true,
  },
}
```

### Provider Factory

```typescript
class LLMProviderFactory {
  private providers: Map<string, ILLMProvider> = new Map()

  constructor() {
    this.registerProvider(new OpenAIProvider())
    this.registerProvider(new AnthropicProvider())
    this.registerProvider(new GoogleProvider())
    this.registerProvider(new OllamaProvider())
  }

  registerProvider(provider: ILLMProvider): void {
    this.providers.set(provider.id, provider)
  }

  getProvider(providerId: string): ILLMProvider | null {
    return this.providers.get(providerId) || null
  }

  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.values())
      .filter((p) => this.isProviderConfigured(p.id))
      .map((p) => PROVIDER_CONFIGS[p.id as LLMProviderType])
  }

  private isProviderConfigured(providerId: string): boolean {
    const config = PROVIDER_CONFIGS[providerId as LLMProviderType]
    return config && !!process.env[config.apiKeyName]
  }
}
```

## UI/UX Design Principles

### Visual Design

- **Clean, minimal interface** with generous white space
- **Progressive disclosure** - show information when needed
- **Consistent color scheme** with primary, secondary, and accent colors
- **Responsive design** that works on mobile, tablet, and desktop
- **Dark/light mode toggle** for user preference

### User Experience

- **Onboarding flow** with interactive tutorial
- **Immediate feedback** on all user actions
- **Undo/redo functionality** for question answers
- **Keyboard shortcuts** for power users
- **Loading states** with meaningful progress indicators

### Component Architecture

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form-specific components
│   ├── layout/       # Layout components
│   ├── providers/    # LLM provider components
│   └── features/     # Feature-specific components
├── pages/
├── hooks/
├── services/
│   ├── llm/          # LLM provider implementations
│   └── api/          # API service layer
├── types/
└── utils/
```

### Frontend LLM Provider Integration

```typescript
// Provider selection component
interface ProviderSelectorProps {
  selectedProvider: string
  onProviderChange: (providerId: string) => void
  onModelChange: (model: string) => void
  availableProviders: LLMProvider[]
}

// Provider status hook
const useProviderStatus = () => {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkProviderAvailability()
  }, [])

  const checkProviderAvailability = async () => {
    // Check which providers are configured and available
  }

  return { providers, loading, refresh: checkProviderAvailability }
}

// LLM service hook
const useLLMService = (providerId: string) => {
  const generateQuestions = async (prompt: string) => {
    return await fetch('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, provider: providerId }),
    })
  }

  const refinePrompt = async (sessionId: string, answers: Answer[]) => {
    return await fetch('/api/prompts/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answers, provider: providerId }),
    })
  }

  return { generateQuestions, refinePrompt }
}
```

## Key Features Implementation

### 1. Prompt Input Interface

- Large, focused textarea with placeholder examples
- Real-time character count (500-2000 characters recommended)
- Prompt type selector (creative, analytical, instructional, etc.)
- Save as draft functionality

### 2. Question Generation Engine

- Integration with OpenAI GPT-4 or Anthropic Claude
- Prompt engineering for consistent question quality
- Question categorization (clarity, specificity, context, constraints)
- Fallback questions for edge cases

### 3. Refinement Interface

- Card-based question display with smooth animations
- Large, accessible yes/no buttons
- Progress bar showing completion percentage
- Breadcrumb navigation for question history

### 4. Real-time Prompt Preview

- Side panel showing current refined prompt
- Highlight changes from original prompt
- Word count and readability metrics
- Copy-to-clipboard with success feedback

### 5. LLM Provider Selection

- Dropdown or card-based provider selection interface
- Real-time provider availability checking
- Model selection within chosen provider
- Provider-specific configuration options
- Fallback to default provider if preferred is unavailable

## LLM Integration Strategy

### Question Generation Prompt

```
Given this initial prompt: "{user_prompt}"

Generate 5-7 yes/no questions that will help refine this prompt to be more specific and effective. Focus on:
- Clarity of intent
- Specific constraints or requirements
- Target audience or context
- Desired output format
- Level of detail needed

Format each question as a JSON object with:
- question: string
- category: "clarity" | "specificity" | "context" | "constraints"
- impact: "high" | "medium" | "low"
```

### Prompt Refinement Logic

- Weight answers based on question impact
- Use template-based refinement for consistency
- Maintain original intent while adding specificity
- Provide explanations for major changes

## Performance Considerations

### Frontend Optimization

- Code splitting for route-based chunks
- Lazy loading for non-critical components
- Debounced API calls for real-time features
- Optimistic updates for better UX

### Backend Optimization

- In-memory session management with TTL
- Caching for frequently accessed data (templates, provider configs)
- Rate limiting to prevent API abuse
- Compression for API responses
- LLM API request optimization and retry logic

## Security & Privacy

### Data Protection

- Secure API key handling (never log or expose)
- Implement proper session management with expiration
- Input validation and sanitization
- HTTPS enforcement
- No persistent storage of user prompts by default

### Privacy Considerations

- Clear privacy policy about session-based processing
- Sessions expire automatically after 24 hours
- No long-term storage of user prompts
- No sharing of prompts - processing happens in isolated sessions
- Anonymous usage analytics only (no personally identifiable information)

## Development Setup

### Prerequisites

```bash
# Node.js 18+
# At least one LLM provider API key:
#   - OpenAI API key (sk-...)
#   - Anthropic API key (sk-ant-...)
#   - Google AI API key
#   - Or local Ollama installation
```

### Project Structure

```
prompt-refinement-app/
├── frontend/          # React TypeScript app
├── backend/           # Node.js Express API
├── shared/            # Shared types and utilities
├── docker/            # Docker configuration
├── docs/              # Documentation
└── scripts/           # Build and deployment scripts
```

### Environment Variables

```bash
# Backend Configuration
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your-session-secret

# LLM Provider API Keys (Bring Your Own Keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434

# Optional: Default provider and models
DEFAULT_LLM_PROVIDER=openai
DEFAULT_MODEL=gpt-4
MAX_QUESTIONS_PER_SESSION=10
SESSION_TIMEOUT_HOURS=24

# Frontend
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Prompt Refiner
VITE_DEFAULT_PROVIDER=openai
VITE_ENABLE_PROVIDER_SELECTION=true
```

## Deployment Strategy

### Production Environment

- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Railway, Render, Fly.io, or AWS Lambda
- **Session Storage**: In-memory with Redis for scaling (optional)
- **CDN**: CloudFront for static assets

### CI/CD Pipeline

1. Automated testing on PR creation
2. Build and deploy to staging environment
3. Manual approval for production deployment
4. Automated rollback on deployment failure

## Analytics & Monitoring

### User Analytics

- Prompt refinement success rate
- Average questions needed per refinement
- Most common prompt types
- User engagement metrics

### Technical Monitoring

- API response times
- Error rates and types
- Session management metrics
- LLM API costs and usage
- Provider availability and performance

## Future Enhancements

### Phase 2 Features

- Multi-language support
- Advanced prompt templates
- Collaborative refinement sessions
- API for third-party integrations

### Phase 3 Features

- AI-powered prompt suggestions
- Integration with popular AI platforms
- Prompt performance analytics
- Team workspace functionality

## Success Metrics

### User Engagement

- Time spent in refinement process
- Completion rate of refinement sessions
- Return user percentage
- Shared refinements count

### Product Quality

- User satisfaction scores
- Prompt improvement ratings
- Feature adoption rates
- Support ticket volume

---

This specification provides a comprehensive foundation for building a sophisticated prompt refinement application that combines powerful AI capabilities with an intuitive user experience.
