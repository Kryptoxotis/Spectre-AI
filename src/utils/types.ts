/**
 * TypeScript type definitions for Spectre AI Assistant
 */

/**
 * Project types
 */
export type ProjectType = 'website' | 'automation';

/**
 * Project status
 */
export type ProjectStatus = 'planning' | 'active' | 'executing' | 'completed' | 'stopped' | 'failed';

/**
 * Execution step types
 */
export type StepType = 
  | 'setup' 
  | 'planning' 
  | 'development' 
  | 'testing' 
  | 'deployment' 
  | 'integration' 
  | 'infrastructure' 
  | 'analysis';

/**
 * Execution step status
 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Plan status
 */
export type PlanStatus = 'draft' | 'approved' | 'executing' | 'completed' | 'failed';

/**
 * Question session status
 */
export type SessionStatus = 'active' | 'completed' | 'cancelled';

/**
 * Agent interface
 */
export interface Agent {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  getHealth(): Promise<{ status: string; [key: string]: any }>;
}

/**
 * Project interface
 */
export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata: Map<string, any>;
}

/**
 * Execution step interface
 */
export interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  type: StepType;
  dependencies: string[];
  estimatedDuration: number; // in minutes
  required: boolean;
  order: number;
  status?: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Execution plan interface
 */
export interface ExecutionPlan {
  id: string;
  projectId: string;
  projectType: ProjectType;
  steps: ExecutionStep[];
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedDuration: number; // in minutes
  requirements: Map<string, any>;
}

/**
 * Question pattern interface
 */
export interface QuestionPattern {
  id: string;
  type: ProjectType;
  questions: string[];
  required: boolean;
  order: number;
}

/**
 * Question session interface
 */
export interface QuestionSession {
  id: string;
  projectId: string;
  projectType: ProjectType;
  currentPattern: number;
  answers: Map<string, string[]>;
  patterns: QuestionPattern[];
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  type: 'success' | 'failure' | 'warning' | 'debug';
  agent: string;
  action: string;
  error?: string;
  projectId?: string;
  context?: string;
  status?: string;
  metadata?: Record<string, any>;
}

/**
 * System health interface
 */
export interface SystemHealth {
  status: string;
  agents: number;
  projects: number;
  plans: number;
  uptime: number;
}

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

/**
 * Project creation request interface
 */
export interface CreateProjectRequest {
  name: string;
  type: ProjectType;
  description?: string;
}

/**
 * Step execution result interface
 */
export interface StepExecutionResult {
  success: boolean;
  stepId: string;
  duration: number;
  error?: string;
  output?: any;
}

/**
 * Plan execution result interface
 */
export interface PlanExecutionResult {
  success: boolean;
  planId: string;
  completedSteps: number;
  totalSteps: number;
  duration: number;
  errors: string[];
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  score: number;
  recommendations: string[];
}

/**
 * Review result interface
 */
export interface ReviewResult {
  passed: boolean;
  issues: string[];
  score: number;
  feedback: string;
}

/**
 * Learning data interface
 */
export interface LearningData {
  id: string;
  type: 'success' | 'failure' | 'pattern';
  data: Record<string, any>;
  timestamp: Date;
  projectId?: string;
  agentId?: string;
}

/**
 * MCP client configuration interface
 */
export interface MCPClientConfig {
  name: string;
  url: string;
  token?: string;
  enabled: boolean;
}

/**
 * Integration configuration interface
 */
export interface IntegrationConfig {
  github?: MCPClientConfig;
  notion?: MCPClientConfig;
  supabase?: MCPClientConfig;
  vercel?: MCPClientConfig;
}