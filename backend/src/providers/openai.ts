import OpenAI from 'openai';
import { BaseLLMProvider } from './base';
import { Question, Answer, GenerationOptions, RefinementOptions } from '../types';
import config from '../config';

export class OpenAIProvider extends BaseLLMProvider {
  readonly id = 'openai';
  readonly name = 'openai';
  readonly displayName = 'OpenAI';
  readonly supportedModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

  private client: OpenAI | null = null;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient() {
    if (config.llmProviders.openai?.apiKey) {
      this.client = new OpenAI({
        apiKey: config.llmProviders.openai.apiKey,
        baseURL: config.llmProviders.openai.baseUrl,
      });
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new OpenAI({
        apiKey,
        baseURL: config.llmProviders.openai?.baseUrl,
      });

      await testClient.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI API key validation failed:', error);
      return false;
    }
  }

  async generateQuestions(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Question[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please check your API key.');
    }

    const model = options?.model || 'gpt-4';
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
        throw new Error('No content received from OpenAI');
      }

      const questions = this.parseQuestionsFromResponse(content);
      if (questions.length === 0) {
        throw new Error('OpenAI returned an invalid response format. Unable to parse questions from the response.');
      }

      return questions.slice(0, maxQuestions);
    } catch (error: any) {
      console.error('OpenAI question generation failed:', error);
      
      // Enhance error with more specific information
      if (error.response?.status === 401) {
        throw new Error('OpenAI API key is invalid or expired. Please check your API key configuration.');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please wait a moment before trying again or upgrade your plan.');
      } else if (error.response?.status === 404) {
        throw new Error(`OpenAI model "${model}" is not available or accessible with your current plan.`);
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to OpenAI. Please check your internet connection.');
      } else if (error.message?.includes('parse questions')) {
        throw error; // Re-throw parsing errors as-is
      } else {
        throw new Error(`OpenAI API error: ${error.message || 'Unknown error occurred'}`);
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
      throw new Error('OpenAI client not initialized. Please check your API key.');
    }

    const model = options?.model || 'gpt-4';
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
        throw new Error('No content received from OpenAI');
      }

      return refinedPrompt.trim();
    } catch (error) {
      console.error('OpenAI prompt refinement failed:', error);
      throw new Error('Failed to refine prompt using OpenAI');
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