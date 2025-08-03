import { ILLMProvider, Question, Answer, GenerationOptions, RefinementOptions } from '../types';
import { getPrompt, type ProviderId, type PromptType } from '../prompts';

export abstract class BaseLLMProvider implements ILLMProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly supportedModels: string[];

  abstract validateApiKey(apiKey: string): Promise<boolean>;
  abstract generateQuestions(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Question[]>;
  abstract refinePrompt(
    originalPrompt: string,
    questions: Question[],
    answers: Answer[],
    options?: RefinementOptions
  ): Promise<string>;

  protected generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected formatQuestionsForPrompt(questions: Question[], answers: Answer[]): string {
    const answeredQuestions = questions.map(q => {
      const answer = answers.find(a => a.questionId === q.id);
      let answerText = 'Not answered';
      
      if (answer) {
        if (typeof answer.response === 'boolean') {
          // Handle legacy boolean answers
          answerText = answer.response ? 'Yes' : 'No';
        } else {
          // Handle new string answers
          answerText = answer.response.toString();
        }
      }
      
      return `Q: ${q.text}\nA: ${answerText}`;
    });

    return answeredQuestions.join('\n\n');
  }

  protected buildSystemPrompt(type: PromptType): string {
    return getPrompt(this.id as ProviderId, type);
  }

  protected parseQuestionsFromResponse(response: string): Question[] {
    console.log('Parsing LLM response:', response.substring(0, 500) + '...');
    try {
      const parsed = JSON.parse(response);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        console.log(`Successfully parsed ${parsed.questions.length} questions from LLM`);
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
        console.warn('LLM response missing questions array:', parsed);
      }
    } catch (error) {
      console.error('Failed to parse questions response:', error);
      console.error('Raw response was:', response);
    }
    console.log('Falling back to hardcoded questions');
    return [];
  }
} 