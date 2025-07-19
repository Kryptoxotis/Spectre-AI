/**
 * Orchestrator - Main coordination system for Spectre AI Assistant
 * Manages agents, projects, and execution flow
 */

import { Agent, Project, ProjectType, ExecutionPlan, ProjectStatus } from '@/utils/types';
import { spectreLogger } from './logger';

/**
 * Orchestrator Class
 */
class Orchestrator {
  private agents: Map<string, Agent> = new Map();
  private projects: Map<string, Project> = new Map();
  private plans: Map<string, ExecutionPlan> = new Map();
  private isShutdown = false;

  /**
   * Register an agent with the orchestrator
   */
  public registerAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
    spectreLogger.success('orchestrator', 'agent_registered', undefined, undefined,
      `Agent registered: ${agent.name}`, 'agent_ready');
  }

  /**
   * Get an agent by name
   */
  public getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Create a new project
   */
  public async createProject(
    name: string, 
    type: ProjectType, 
    description?: string
  ): Promise<Project> {
    const project: Project = {
      id: `project_${Date.now()}`,
      name,
      type,
      description: description || '',
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: new Map()
    };

    this.projects.set(project.id, project);

    spectreLogger.success('orchestrator', 'project_created', undefined, project.id,
      `Project created: ${name}`, 'project_ready');

    return project;
  }

  /**
   * Get a project by ID
   */
  public getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  /**
   * Get all projects
   */
  public getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  /**
   * Start a project
   */
  public async startProject(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    project.status = 'active';
    project.updatedAt = new Date();

    spectreLogger.success('orchestrator', 'project_started', undefined, projectId,
      `Project started: ${project.name}`, 'project_active');
  }

  /**
   * Stop a project
   */
  public async stopProject(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    project.status = 'stopped';
    project.updatedAt = new Date();

    spectreLogger.success('orchestrator', 'project_stopped', undefined, projectId,
      `Project stopped: ${project.name}`, 'project_inactive');
  }

  /**
   * Generate execution plan for a project
   */
  public async generateExecutionPlan(projectId: string): Promise<ExecutionPlan> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const planner = this.agents.get('planner');
    if (!planner) {
      throw new Error('Planner agent not found');
    }

    // For now, create a basic plan
    const plan: ExecutionPlan = {
      id: `plan_${projectId}_${Date.now()}`,
      projectId,
      projectType: project.type,
      steps: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDuration: 0,
      requirements: new Map()
    };

    this.plans.set(plan.id, plan);

    spectreLogger.success('orchestrator', 'plan_generated', undefined, projectId,
      `Execution plan generated`, 'plan_ready');

    return plan;
  }

  /**
   * Execute a project plan
   */
  public async executeProjectPlan(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const plan = Array.from(this.plans.values()).find(p => p.projectId === projectId);
    if (!plan) {
      throw new Error(`No plan found for project ${projectId}`);
    }

    project.status = 'executing';
    project.updatedAt = new Date();

    spectreLogger.success('orchestrator', 'plan_execution_started', undefined, projectId,
      `Plan execution started`, 'execution_in_progress');

    // Simulate plan execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    project.status = 'completed';
    project.updatedAt = new Date();

    spectreLogger.success('orchestrator', 'plan_execution_completed', undefined, projectId,
      `Plan execution completed`, 'execution_successful');
  }

  /**
   * Get project logs
   */
  public getProjectLogs(projectId: string, limit: number = 50): any[] {
    // This would typically query the logging system
    // For now, return mock logs
    return [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Project ${projectId} logs retrieved`,
        projectId
      }
    ].slice(0, limit);
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): {
    status: string;
    agents: number;
    projects: number;
    plans: number;
    uptime: number;
  } {
    return {
      status: this.isShutdown ? 'shutdown' : 'healthy',
      agents: this.agents.size,
      projects: this.projects.size,
      plans: this.plans.size,
      uptime: process.uptime()
    };
  }

  /**
   * Shutdown the orchestrator
   */
  public async shutdown(): Promise<void> {
    this.isShutdown = true;
    
    spectreLogger.success('orchestrator', 'shutdown_started', undefined, undefined,
      'Orchestrator shutdown started', 'cleanup_in_progress');

    // Cleanup resources
    this.agents.clear();
    this.projects.clear();
    this.plans.clear();

    spectreLogger.success('orchestrator', 'shutdown_completed', undefined, undefined,
      'Orchestrator shutdown completed', 'cleanup_finished');
  }
}

// Export singleton instance
export const orchestrator = new Orchestrator();