import { ILLMProvider, Question, Answer, GenerationOptions, RefinementOptions } from '../types';

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
      return `Q: ${q.text}\nA: ${answer ? (answer.response ? 'Yes' : 'No') : 'Not answered'}`;
    });

    return answeredQuestions.join('\n\n');
  }

  protected buildSystemPrompt(type: 'generation' | 'refinement'): string {
    if (type === 'generation') {
      return `You are a prompt refinement assistant. Your task is to generate targeted yes/no questions that will help users refine their initial prompts into more specific and effective versions.

When generating questions, focus on:
1. Clarity of intent - What exactly does the user want to achieve?
2. Specificity - What specific details, constraints, or parameters are needed?
3. Context - What is the target audience, use case, or environment?
4. Constraints - Are there any limitations, requirements, or preferred formats?

Generate 5-7 questions that are:
- Clear and unambiguous
- Answerable with yes/no
- Progressive (building on each other)
- Impactful for prompt refinement

Return the questions in JSON format with the following structure:
{
  "questions": [
    {
      "text": "Question text here",
      "category": "clarity|specificity|context|constraints",
      "impact": "high|medium|low",
      "explanation": "Brief explanation of why this question matters"
    }
  ]
}`;
    } else {
      return `You are a prompt refinement assistant. Your task is to take the user's original prompt and their answers to targeted questions, then create a refined, more specific version of the prompt.

Guidelines for refinement:
1. Preserve the original intent and core purpose
2. Add specific details based on the user's answers
3. Improve clarity and reduce ambiguity
4. Include relevant constraints or parameters
5. Make the prompt more actionable and specific

The refined prompt should be:
- Clear and specific
- Actionable
- Well-structured
- Preserving the original voice and style when possible

Return only the refined prompt text, without any additional commentary or formatting.`;
    }
  }

  protected parseQuestionsFromResponse(response: string): Question[] {
    try {
      const parsed = JSON.parse(response);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions.map((q: any, index: number) => ({
          id: this.generateQuestionId(),
          text: q.text,
          order: index,
          category: q.category || 'clarity',
          impact: q.impact || 'medium',
          explanation: q.explanation,
        }));
      }
    } catch (error) {
      console.error('Failed to parse questions response:', error);
    }
    return [];
  }
} 