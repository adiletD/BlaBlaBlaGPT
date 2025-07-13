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
            content: `Please generate ${maxQuestions} targeted yes/no questions to help refine this prompt:\n\n"${prompt}"\n\nRemember to focus on clarity, specificity, context, and constraints.`,
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
        // Fallback to basic questions if parsing fails
        return this.generateFallbackQuestions(prompt);
      }

      return questions.slice(0, maxQuestions);
    } catch (error) {
      console.error('OpenAI question generation failed:', error);
      return this.generateFallbackQuestions(prompt);
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
        text: 'Do you want the response to be detailed and comprehensive?',
        category: 'specificity' as const,
        impact: 'high' as const,
        explanation: 'Helps determine the level of detail needed',
      },
      {
        text: 'Are you looking for a creative or analytical response?',
        category: 'clarity' as const,
        impact: 'high' as const,
        explanation: 'Clarifies the type of thinking required',
      },
      {
        text: 'Do you have a specific audience in mind for this response?',
        category: 'context' as const,
        impact: 'medium' as const,
        explanation: 'Helps tailor the response appropriately',
      },
      {
        text: 'Should the response include examples or specific instances?',
        category: 'specificity' as const,
        impact: 'medium' as const,
        explanation: 'Determines whether to include concrete examples',
      },
      {
        text: 'Are there any topics or approaches you want to avoid?',
        category: 'constraints' as const,
        impact: 'medium' as const,
        explanation: 'Identifies any limitations or restrictions',
      },
    ];

    return fallbackQuestions.map((q, index) => ({
      id: this.generateQuestionId(),
      text: q.text,
      order: index,
      category: q.category,
      impact: q.impact,
      explanation: q.explanation,
    }));
  }
} 