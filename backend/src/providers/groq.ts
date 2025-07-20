import OpenAI from 'openai';
import { BaseLLMProvider } from './base';
import { Question, Answer, GenerationOptions, RefinementOptions } from '../types';
import config from '../config';

export class GroqProvider extends BaseLLMProvider {
  readonly id = 'groq';
  readonly name = 'groq';
  readonly displayName = 'Groq';
  readonly supportedModels = [
    'llama-3.3-70b-versatile',
    'llama-4-scout',
    'kimi-k2',
    'gemma2-9b-it',
    'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile',
    'mixtral-8x7b-32768',
  ];

  private client: OpenAI | null = null;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient() {
    if (config.llmProviders.groq?.apiKey) {
      this.client = new OpenAI({
        apiKey: config.llmProviders.groq.apiKey,
        baseURL: config.llmProviders.groq.baseUrl || 'https://api.groq.com/openai/v1',
      });
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new OpenAI({
        apiKey,
        baseURL: config.llmProviders.groq?.baseUrl || 'https://api.groq.com/openai/v1',
      });

      await testClient.models.list();
      return true;
    } catch (error) {
      console.error('Groq API key validation failed:', error);
      return false;
    }
  }

  private parseGroqResponse(content: string): Question[] {
    console.log('Parsing Groq response:', content.substring(0, 500) + '...');
    
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    let jsonString = jsonMatch ? jsonMatch[1] : content;
    
    // If no markdown block found, try to find JSON directly
    if (!jsonMatch) {
      // Look for JSON object in the response
      const directJsonMatch = content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (directJsonMatch) {
        jsonString = directJsonMatch[0];
      }
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        console.log(`Successfully parsed ${parsed.questions.length} questions from Groq`);
        return parsed.questions.map((q: any, index: number) => ({
          id: this.generateQuestionId(),
          text: q.text,
          order: index,
          category: q.category || 'clarity',
          impact: q.impact || 'medium',
          explanation: q.explanation,
          options: q.options || ['Yes', 'Maybe', 'No'],
          defaultOption: q.defaultOption || 1,
        }));
      } else {
        console.warn('Groq response missing questions array:', parsed);
      }
    } catch (error) {
      console.error('Failed to parse Groq JSON response:', error);
      console.error('Attempted to parse:', jsonString.substring(0, 200));
      
      // Try fallback parsing for different formats
      return this.tryFallbackParsing(content);
    }
    
    return [];
  }

  private tryFallbackParsing(content: string): Question[] {
    console.log('Attempting fallback parsing for Groq response');
    
    // If JSON parsing fails, try to extract questions from a different format
    // Some LLMs might return a list format instead of JSON
    const questionPattern = /(?:Question \d+|Q\d*[:.)]|\d+\.)([^?]*\?)/gi;
    const matches = content.match(questionPattern);
    
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} questions using fallback parsing`);
      return matches.slice(0, 7).map((match, index) => ({
        id: this.generateQuestionId(),
        text: match.replace(/^(?:Question \d+|Q\d*[:.)]|\d+\.)/, '').trim(),
        order: index,
        category: 'clarity' as const,
        impact: 'medium' as const,
        explanation: 'Auto-generated question from Groq response',
        options: ['Yes', 'Somewhat', 'No'],
        defaultOption: 1,
      }));
    }
    
    console.log('All parsing attempts failed, returning empty array');
    return [];
  }

  protected buildSystemPrompt(type: 'generation' | 'refinement'): string {
    if (type === 'generation') {
      return `You are a prompt refinement assistant. Your task is to generate targeted questions that help users refine their prompts.

CRITICAL: You MUST respond with ONLY valid JSON in the exact format shown below. Do not include any markdown formatting, explanations, or additional text.

Generate 5-7 questions focusing on:
1. Clarity of intent
2. Specificity of requirements  
3. Context and audience
4. Constraints and limitations

Each question must have exactly 3 meaningful options where the middle option (index 1) is the default.

RESPOND WITH ONLY THIS JSON FORMAT:
{
  "questions": [
    {
      "text": "What level of detail should the response include?",
      "category": "specificity",
      "impact": "high",
      "explanation": "Determines the depth and comprehensiveness needed",
      "options": ["Basic overview", "Detailed explanation", "Comprehensive guide"],
      "defaultOption": 1
    }
  ]
}

Remember: 
- ONLY return valid JSON
- NO markdown code blocks
- NO additional text or explanations
- Exactly 3 options per question
- Categories: "clarity", "specificity", "context", "constraints"
- Impact levels: "high", "medium", "low"`;
    } else {
      return super.buildSystemPrompt(type);
    }
  }

  async generateQuestions(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Question[]> {
    if (!this.client) {
      throw new Error('Groq client not initialized. Please check your API key.');
    }

    const model = options?.model || 'llama-3.3-70b-versatile';
    const maxQuestions = options?.maxQuestions || 7;
    const temperature = options?.temperature || 0.7;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt('generation'),
          },
          {
            role: 'user',
            content: `Please generate ${maxQuestions} targeted questions with 3 options each to help refine this prompt:\n\n"${prompt}"\n\nRemember to focus on clarity, specificity, context, and constraints. Each question should have exactly 3 meaningful options with the middle option as the default.`,
          },
        ],
        temperature,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from Groq');
      }

      const questions = this.parseGroqResponse(content);
      if (questions.length === 0) {
        throw new Error('Groq returned an invalid response format. Unable to parse questions from the response.');
      }

      return questions.slice(0, maxQuestions);
    } catch (error: any) {
      console.error('Groq question generation failed:', error);
      
      // Enhance error with more specific information
      if (error.response?.status === 401) {
        throw new Error('Groq API key is invalid or expired. Please check your API key configuration.');
      } else if (error.response?.status === 429) {
        throw new Error('Groq rate limit exceeded. Please wait a moment before trying again or upgrade your plan.');
      } else if (error.response?.status === 404) {
        throw new Error(`Groq model "${model}" is not available or accessible with your current plan.`);
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to Groq. Please check your internet connection.');
      } else if (error.message?.includes('parse questions')) {
        throw error; // Re-throw parsing errors as-is
      } else {
        throw new Error(`Groq API error: ${error.message || 'Unknown error occurred'}`);
      }
    }
  }

  async refinePrompt(
    originalPrompt: string,
    questions: Question[],
    answers: Answer[],
    options?: RefinementOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not initialized. Please check your API key.');
    }

    const model = options?.model || 'llama-3.3-70b-versatile';
    const temperature = options?.temperature || 0.3;

    try {
      const questionsAndAnswers = this.formatQuestionsForPrompt(questions, answers);

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt('refinement'),
          },
          {
            role: 'user',
            content: `Original prompt: "${originalPrompt}"\n\nQuestions and answers:\n${questionsAndAnswers}\n\nPlease create a refined version of the original prompt based on these answers.`,
          },
        ],
        temperature,
        max_tokens: 1000,
      });

      const refinedPrompt = response.choices[0]?.message?.content;
      if (!refinedPrompt) {
        throw new Error('No content received from Groq');
      }

      return refinedPrompt.trim();
    } catch (error) {
      console.error('Groq prompt refinement failed:', error);
      throw new Error('Failed to refine prompt using Groq');
    }
  }

  private generateFallbackQuestions(prompt: string): Question[] {
    const fallbackQuestions = [
      {
        text: 'What level of detail do you want in the response?',
        category: 'specificity' as const,
        impact: 'high' as const,
        explanation: 'Helps determine the level of detail needed',
        options: ['Basic', 'Detailed', 'Comprehensive'],
        defaultOption: 1,
      },
      {
        text: 'What type of thinking approach do you prefer?',
        category: 'clarity' as const,
        impact: 'high' as const,
        explanation: 'Clarifies the type of thinking required',
        options: ['Creative', 'Balanced', 'Analytical'],
        defaultOption: 1,
      },
      {
        text: 'How specific should the audience targeting be?',
        category: 'context' as const,
        impact: 'medium' as const,
        explanation: 'Helps tailor the response appropriately',
        options: ['General', 'Somewhat Specific', 'Highly Specific'],
        defaultOption: 1,
      },
      {
        text: 'How many examples should be included?',
        category: 'specificity' as const,
        impact: 'medium' as const,
        explanation: 'Determines whether to include concrete examples',
        options: ['Few', 'Moderate', 'Many'],
        defaultOption: 1,
      },
      {
        text: 'How strict should the constraints be?',
        category: 'constraints' as const,
        impact: 'medium' as const,
        explanation: 'Identifies any limitations or restrictions',
        options: ['Flexible', 'Moderate', 'Strict'],
        defaultOption: 1,
      },
    ];

    return fallbackQuestions.map((q, index) => ({
      id: this.generateQuestionId(),
      text: q.text,
      order: index,
      category: q.category,
      impact: q.impact,
      explanation: q.explanation,
      options: q.options,
      defaultOption: q.defaultOption,
    }));
  }
} 