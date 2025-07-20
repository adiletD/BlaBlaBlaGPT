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

  protected buildSystemPrompt(type: 'generation' | 'refinement'): string {
    if (type === 'generation') {
      return `You are a prompt refinement assistant. Your task is to generate targeted questions with 3 options that will help users refine their initial prompts into more specific and effective versions.

When generating questions, focus on:
1. Clarity of intent - What exactly does the user want to achieve?
2. Specificity - What specific details, constraints, or parameters are needed?
3. Context - What is the target audience, use case, or environment?
4. Constraints - Are there any limitations, requirements, or preferred formats?

Generate 5-7 questions that are:
- Clear and unambiguous
- Have exactly 3 meaningful options
- Progressive (building on each other)
- Impactful for prompt refinement

For each question, provide 3 options that can be:
- Yes/No/Maybe (for binary questions with uncertainty)
- Low/Medium/High (for degree or intensity)
- Basic/Detailed/Comprehensive (for depth level)
- Creative/Balanced/Analytical (for approach type)
- Or any other relevant 3-option scale

The middle option (index 1) should be the default/neutral choice.

Return the questions in JSON format with the following structure:
{
  "questions": [
    {
      "text": "Question text here",
      "category": "clarity|specificity|context|constraints",
      "impact": "high|medium|low",
      "explanation": "Brief explanation of why this question matters",
      "options": ["Option 1", "Option 2", "Option 3"],
      "defaultOption": 1
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