import { 
  RefinementSession, 
  Question, 
  Answer, 
  CreateSessionRequest, 
  CreateSessionResponse, 
  RefinePromptRequest, 
  RefinePromptResponse, 
  GenerationOptions, 
  RefinementOptions 
} from '../types';
import { llmProviderFactory } from '../providers';
import { sessionStorage } from './sessionStorage';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

export class PromptRefinementService {
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const { originalPrompt, llmProvider, model } = request;

    // Validate provider
    const provider = llmProviderFactory.getProvider(llmProvider);
    if (!provider) {
      throw new Error(`LLM provider '${llmProvider}' is not available`);
    }

    // Create new session
    const session = sessionStorage.createNewSession(originalPrompt, llmProvider, model);
    
    // Generate initial questions
    const questions = await this.generateQuestions(originalPrompt, llmProvider, model);
    
    // Update session with questions
    session.questions = questions;
    session.status = 'refining';
    
    // Store session
    await sessionStorage.createSession(session);

    return {
      session,
      questions,
    };
  }

  async getSession(sessionId: string): Promise<RefinementSession | null> {
    return await sessionStorage.getSession(sessionId);
  }

  async answerQuestion(sessionId: string, questionId: string, response: boolean | string): Promise<Answer> {
    const session = await sessionStorage.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Find the question
    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found in session`);
    }

    // Create answer
    const answer: Answer = {
      id: uuidv4(),
      questionId,
      response,
      timestamp: new Date(),
    };

    // Add or update answer
    const existingAnswerIndex = session.answers.findIndex(a => a.questionId === questionId);
    if (existingAnswerIndex >= 0) {
      session.answers[existingAnswerIndex] = answer;
    } else {
      session.answers.push(answer);
    }

    // Update session
    await sessionStorage.updateSession(sessionId, {
      answers: session.answers,
    });

    return answer;
  }

  async refinePrompt(request: RefinePromptRequest): Promise<RefinePromptResponse> {
    const { sessionId, answers, llmProvider, model } = request;

    const session = await sessionStorage.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const provider = llmProviderFactory.getProvider(llmProvider);
    if (!provider) {
      throw new Error(`LLM provider '${llmProvider}' is not available`);
    }

    // Update session with answers
    session.answers = answers;

    // Generate refined prompt
    const refinedPrompt = await provider.refinePrompt(
      session.originalPrompt,
      session.questions,
      answers,
      {
        model,
        temperature: 0.3,
        explainChanges: true,
      }
    );

    // Generate new questions based on the refined prompt
    const newQuestions = await this.generateQuestions(refinedPrompt, llmProvider, model);

    // Update session
    await sessionStorage.updateSession(sessionId, {
      refinedPrompt,
      answers,
      questions: newQuestions,
      status: 'refining', // Keep status as refining for continuous refinement
    });

    const updatedSession = await sessionStorage.getSession(sessionId);
    if (!updatedSession) {
      throw new Error('Failed to retrieve updated session');
    }

    return {
      refinedPrompt,
      session: updatedSession,
    };
  }

  async generateQuestions(
    prompt: string, 
    llmProvider: string, 
    model?: string
  ): Promise<Question[]> {
    console.log(`Generating questions with provider: ${llmProvider}, model: ${model || 'default'}`);
    
    const provider = llmProviderFactory.getProvider(llmProvider);
    if (!provider) {
      console.error(`LLM provider '${llmProvider}' is not available`);
      throw new Error(`LLM provider '${llmProvider}' is not available`);
    }

    console.log(`Provider found: ${provider.displayName}, maxQuestions: ${config.maxQuestionsPerSession}`);

    const options: GenerationOptions = {
      model,
      maxQuestions: config.maxQuestionsPerSession,
      temperature: 0.7,
      categories: ['clarity', 'specificity', 'context', 'constraints'],
    };

    try {
      const questions = await provider.generateQuestions(prompt, options);
      console.log(`Generated ${questions.length} questions successfully`);
      return questions;
    } catch (error) {
      console.error('Question generation failed:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await sessionStorage.deleteSession(sessionId);
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
  }> {
    const allSessions = sessionStorage.getAllSessions();
    const now = new Date();

    const activeSessions = allSessions.filter(s => 
      s.status === 'refining' && now < s.expiresAt
    ).length;

    const completedSessions = allSessions.filter(s => 
      s.status === 'completed'
    ).length;

    return {
      totalSessions: allSessions.length,
      activeSessions,
      completedSessions,
    };
  }
}

// Export singleton instance
export const promptRefinementService = new PromptRefinementService(); 