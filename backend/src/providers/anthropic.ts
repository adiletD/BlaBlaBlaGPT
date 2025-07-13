import axios from 'axios';
import { BaseLLMProvider } from './base';
import { Question, Answer, GenerationOptions, RefinementOptions } from '../types';
import config from '../config';
import { handleProviderError, errorLogger } from '../utils/errorHandler';

export class AnthropicProvider extends BaseLLMProvider {
  readonly id = 'anthropic';
  readonly name = 'anthropic';
  readonly displayName = 'Anthropic Claude';
  readonly supportedModels = [
    'claude-3-5-sonnet-20241022',   // Latest stable Claude 3.5 Sonnet
    'claude-3-5-sonnet-20240620',   // Previous Claude 3.5 Sonnet
    'claude-3-5-haiku-20241022',    // Latest Claude 3.5 Haiku
    'claude-3-haiku-20240307',      // Claude 3 Haiku
    'claude-3-opus-20240229',       // Claude 3 Opus
    'claude-3-sonnet-20240229',     // Claude 3 Sonnet
  ];

  private apiKey: string | null = null;
  private baseUrl: string;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient() {
    this.apiKey = config.llmProviders.anthropic?.apiKey || null;
    this.baseUrl = config.llmProviders.anthropic?.baseUrl || 'https://api.anthropic.com/v1';
    if (this.apiKey) {
      errorLogger.info('Anthropic provider configured.');
    } else {
      errorLogger.warn('Anthropic API key not found. Provider will be unavailable.');
    }
  }

  isAvailable(): boolean {
    return this.apiKey !== null;
  }

  private async makeApiCall(payload: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is not configured.');
    }

    const response = await axios.post(
      `${this.baseUrl}/messages`,
      payload,
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      }
    );
    return response.data;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    errorLogger.info('Validating Anthropic API key');
    try {
      await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 10,
          messages: [{ role: 'user' as const, content: 'Hello' }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      errorLogger.info('API key validation successful');
      return true;
    } catch (error: any) {
      errorLogger.error('Anthropic API key validation failed', error.response ? error.response.data : error.message);
      return false;
    }
  }

  async generateQuestions(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Question[]> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic provider not available.');
    }

    const model = options?.model || 'claude-3-5-sonnet-20240620';
    const maxQuestions = options?.maxQuestions || 7;

    try {
      const payload = {
        model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user' as const,
            content: `${this.buildSystemPrompt('generation')}\n\nPlease generate ${maxQuestions} targeted yes/no questions to help refine this prompt:\n\n"${prompt}"\n\nRemember to focus on clarity, specificity, context, and constraints.`,
          },
        ],
      };
      
      const response = await this.makeApiCall(payload);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      const questions = this.parseQuestionsFromResponse(content.text);
      return questions.length > 0 ? questions.slice(0, maxQuestions) : this.generateFallbackQuestions(prompt);
    } catch (error) {
      errorLogger.error('Question generation failed', error, { provider: 'anthropic' });
      return this.generateFallbackQuestions(prompt);
    }
  }

  async refinePrompt(
    originalPrompt: string,
    questions: Question[],
    answers: Answer[],
    options?: RefinementOptions
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic provider not available.');
    }

    const model = options?.model || 'claude-3-5-sonnet-20240620';
    const conversation = this.buildRefinementConversation(originalPrompt, questions, answers);

    try {
      const payload = {
        model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user' as const,
            content: conversation,
          },
        ],
      };
      
      const response = await this.makeApiCall(payload);
      
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      return this.parseRefinedPromptFromResponse(content.text);
    } catch (error) {
      errorLogger.error('Prompt refinement failed', error, { provider: 'anthropic' });
      return originalPrompt; // Fallback to original prompt
    }
  }

  private buildRefinementConversation(
    originalPrompt: string,
    questions: Question[],
    answers: Answer[]
  ): string {
    let conversation = `${this.buildSystemPrompt(
      'refinement'
    )}\n\nOriginal prompt: "${originalPrompt}"\n\nQuestions and answers:\n`;
    
    const answerMap = new Map(answers.map(a => [a.questionId, a.answer]));
    
    questions.forEach(q => {
      const answer = answerMap.get(q.id);
      if (answer !== undefined) {
        conversation += `- ${q.text}: ${answer ? 'Yes' : 'No'}\n`;
      }
    });

    conversation += `\nPlease create a refined version of the original prompt based on these answers.`;
    return conversation;
  }

  private parseRefinedPromptFromResponse(responseText: string): string {
    // The model should return only the refined prompt, so we just trim any whitespace
    return responseText.trim();
  }

  private generateFallbackQuestions(prompt: string): Question[] {
    errorLogger.info('Generating fallback questions');
    
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