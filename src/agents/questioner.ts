/**
 * Questioner Agent
 * Manages question patterns and user interaction sessions
 */

import { Agent, QuestionPattern, QuestionSession, ProjectType } from '@/utils/types';
import { spectreLogger } from '@/core/logger';

/**
 * Questioner Agent Implementation
 */
class QuestionerAgent implements Agent {
  public readonly name = 'questioner';
  public readonly description = 'Asks context-relevant questions using learned patterns';
  public readonly version = '1.0.0';

  private questionPatterns: Map<string, QuestionPattern> = new Map();
  private activeSessions: Map<string, QuestionSession> = new Map();

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default question patterns
   */
  private initializeDefaultPatterns(): void {
    // Website patterns
    this.questionPatterns.set('website_basic', {
      id: 'website_basic',
      type: 'website',
      questions: [
        'What is the primary purpose of this website?',
        'Who is your target audience?',
        'What are the main features you want?',
        'Do you have any design preferences or brand guidelines?',
        'What content management needs do you have?',
        'Do you need user authentication?',
        'What integrations are required?',
        'What is your timeline for completion?',
        'Do you have a budget range?',
        'What is your preferred tech stack?'
      ],
      required: true,
      order: 1
    });

    // Automation patterns
    this.questionPatterns.set('automation_basic', {
      id: 'automation_basic',
      type: 'automation',
      questions: [
        'What process are you looking to automate?',
        'What triggers should start the automation?',
        'What actions should the automation perform?',
        'What systems or tools need to be integrated?',
        'How often should this automation run?',
        'What data needs to be processed?',
        'Are there any error handling requirements?',
        'What notifications or alerts are needed?',
        'What is the expected volume of operations?',
        'Do you need reporting or analytics?'
      ],
      required: true,
      order: 1
    });

    // Advanced patterns
    this.questionPatterns.set('website_advanced', {
      id: 'website_advanced',
      type: 'website',
      questions: [
        'What SEO requirements do you have?',
        'Do you need analytics integration?',
        'What security requirements are needed?',
        'Do you need multi-language support?',
        'What performance requirements do you have?',
        'Do you need mobile responsiveness?',
        'What backup and recovery needs exist?',
        'Do you need API endpoints?',
        'What third-party integrations?',
        'What compliance requirements exist?'
      ],
      required: false,
      order: 2
    });

    this.questionPatterns.set('automation_advanced', {
      id: 'automation_advanced',
      type: 'automation',
      questions: [
        'What error recovery mechanisms are needed?',
        'Do you need audit logging?',
        'What performance requirements exist?',
        'Do you need conditional logic?',
        'What data validation is required?',
        'Do you need retry mechanisms?',
        'What monitoring and alerting?',
        'Do you need data transformation?',
        'What compliance requirements exist?',
        'Do you need user approval workflows?'
      ],
      required: false,
      order: 2
    });
  }

  /**
   * Start a new question session
   */
  public async startSession(projectId: string, projectType: ProjectType): Promise<QuestionSession> {
    spectreLogger.success('questioner', 'session_started', undefined, projectId,
      `Starting question session for ${projectType} project`, 'session_created');

    const session: QuestionSession = {
      id: `session_${projectId}_${Date.now()}`,
      projectId,
      projectType,
      currentPattern: 0,
      answers: new Map(),
      patterns: this.getPatternsForType(projectType),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.activeSessions.set(session.id, session);

    spectreLogger.success('questioner', 'session_ready', undefined, projectId,
      `Question session ready with ${session.patterns.length} patterns`, 'awaiting_questions');

    return session;
  }

  /**
   * Get next question for a session
   */
  public async getNextQuestion(sessionId: string): Promise<string | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const currentPattern = session.patterns[session.currentPattern];
    if (!currentPattern) {
      return null; // All questions completed
    }

    const currentQuestionIndex = session.answers.get(currentPattern.id)?.length || 0;
    const question = currentPattern.questions[currentQuestionIndex];

    if (!question) {
      // Move to next pattern
      session.currentPattern++;
      return this.getNextQuestion(sessionId);
    }

    spectreLogger.success('questioner', 'question_generated', undefined, session.projectId,
      `Generated question: ${question.substring(0, 50)}...`, 'question_ready');

    return question;
  }

  /**
   * Submit an answer to a question
   */
  public async submitAnswer(sessionId: string, answer: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const currentPattern = session.patterns[session.currentPattern];
    if (!currentPattern) {
      throw new Error('No active pattern for session');
    }

    // Store the answer
    if (!session.answers.has(currentPattern.id)) {
      session.answers.set(currentPattern.id, []);
    }
    session.answers.get(currentPattern.id)!.push(answer);

    session.updatedAt = new Date();

    spectreLogger.success('questioner', 'answer_submitted', undefined, session.projectId,
      `Answer submitted for pattern ${currentPattern.id}`, 'answer_stored');

    // Check if pattern is complete
    const patternAnswers = session.answers.get(currentPattern.id) || [];
    if (patternAnswers.length >= currentPattern.questions.length) {
      session.currentPattern++;
      spectreLogger.success('questioner', 'pattern_completed', undefined, session.projectId,
        `Pattern ${currentPattern.id} completed`, 'moving_to_next_pattern');
    }
  }

  /**
   * Get session status
   */
  public async getSessionStatus(sessionId: string): Promise<QuestionSession | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Complete a session
   */
  public async completeSession(sessionId: string): Promise<Map<string, string[]>> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'completed';
    session.updatedAt = new Date();

    // Convert answers to a more usable format
    const allAnswers = new Map<string, string[]>();
    for (const [patternId, answers] of session.answers) {
      allAnswers.set(patternId, [...answers]);
    }

    spectreLogger.success('questioner', 'session_completed', undefined, session.projectId,
      `Question session completed with ${allAnswers.size} patterns`, 'session_finalized');

    return allAnswers;
  }

  /**
   * Get patterns for a specific project type
   */
  private getPatternsForType(projectType: ProjectType): QuestionPattern[] {
    const patterns: QuestionPattern[] = [];
    
    for (const pattern of this.questionPatterns.values()) {
      if (pattern.type === projectType) {
        patterns.push(pattern);
      }
    }

    // Sort by order
    return patterns.sort((a, b) => a.order - b.order);
  }

  /**
   * Add a new question pattern
   */
  public async addPattern(pattern: QuestionPattern): Promise<void> {
    this.questionPatterns.set(pattern.id, pattern);
    
    spectreLogger.success('questioner', 'pattern_added', undefined, undefined,
      `Added new question pattern: ${pattern.id}`, 'pattern_registered');
  }

  /**
   * Get all patterns
   */
  public async getAllPatterns(): Promise<QuestionPattern[]> {
    return Array.from(this.questionPatterns.values());
  }

  /**
   * Get agent health status
   */
  public async getHealth(): Promise<{ status: string; patterns: number; activeSessions: number }> {
    return {
      status: 'healthy',
      patterns: this.questionPatterns.size,
      activeSessions: this.activeSessions.size
    };
  }
}

// Export singleton instance
export const questioner = new QuestionerAgent();