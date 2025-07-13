import { RefinementSession, SessionStorage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

export class InMemorySessionStorage implements SessionStorage {
  private sessions: Map<string, RefinementSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  async createSession(session: RefinementSession): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async getSession(sessionId: string): Promise<RefinementSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await this.deleteSession(sessionId);
      return null;
    }

    return { ...session };
  }

  async updateSession(sessionId: string, updates: Partial<RefinementSession>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession = {
      ...session,
      ...updates,
      id: sessionId, // Ensure ID cannot be changed
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, updatedSession);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.deleteSession(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  // Helper methods
  createNewSession(originalPrompt: string, llmProvider: string, model?: string): RefinementSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.sessionTimeoutHours * 60 * 60 * 1000);

    return {
      id: uuidv4(),
      originalPrompt,
      refinedPrompt: '',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      llmProvider,
      model,
      questions: [],
      answers: [],
      expiresAt,
    };
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getAllSessions(): RefinementSession[] {
    return Array.from(this.sessions.values());
  }

  private startCleanupInterval(): void {
    // Clean up expired sessions every 30 minutes
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 30 * 60 * 1000);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}

// Export singleton instance
export const sessionStorage = new InMemorySessionStorage(); 