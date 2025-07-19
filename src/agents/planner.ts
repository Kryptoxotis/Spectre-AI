/**
 * Planner Agent
 * Creates detailed execution plans and manages project planning
 */

import { Agent, ExecutionPlan, ExecutionStep, ProjectType, ProjectStatus } from '@/utils/types';
import { spectreLogger } from '@/core/logger';

/**
 * Planner Agent Implementation
 */
class PlannerAgent implements Agent {
  public readonly name = 'planner';
  public readonly description = 'Breaks tasks into detailed steps; updates plan as needed';
  public readonly version = '1.0.0';

  private plans: Map<string, ExecutionPlan> = new Map();
  private templates: Map<string, ExecutionStep[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize planning templates
   */
  private initializeTemplates(): void {
    // Website planning template
    this.templates.set('website', [
      {
        id: 'setup_repo',
        name: 'Setup GitHub Repository',
        description: 'Create and configure GitHub repository for the project',
        type: 'setup',
        dependencies: [],
        estimatedDuration: 30,
        required: true,
        order: 1
      },
      {
        id: 'setup_project',
        name: 'Initialize Project Structure',
        description: 'Create basic project structure and configuration files',
        type: 'setup',
        dependencies: ['setup_repo'],
        estimatedDuration: 45,
        required: true,
        order: 2
      },
      {
        id: 'design_architecture',
        name: 'Design System Architecture',
        description: 'Plan the overall system architecture and component structure',
        type: 'planning',
        dependencies: ['setup_project'],
        estimatedDuration: 60,
        required: true,
        order: 3
      },
      {
        id: 'setup_database',
        name: 'Setup Database',
        description: 'Configure database schema and connections',
        type: 'infrastructure',
        dependencies: ['design_architecture'],
        estimatedDuration: 90,
        required: true,
        order: 4
      },
      {
        id: 'create_backend',
        name: 'Create Backend API',
        description: 'Develop backend API endpoints and business logic',
        type: 'development',
        dependencies: ['setup_database'],
        estimatedDuration: 180,
        required: true,
        order: 5
      },
      {
        id: 'create_frontend',
        name: 'Create Frontend Interface',
        description: 'Develop user interface and frontend components',
        type: 'development',
        dependencies: ['create_backend'],
        estimatedDuration: 240,
        required: true,
        order: 6
      },
      {
        id: 'setup_cms',
        name: 'Setup Content Management',
        description: 'Configure CMS integration and content management',
        type: 'integration',
        dependencies: ['create_backend'],
        estimatedDuration: 120,
        required: false,
        order: 7
      },
      {
        id: 'setup_deployment',
        name: 'Setup Deployment Pipeline',
        description: 'Configure CI/CD and deployment infrastructure',
        type: 'deployment',
        dependencies: ['create_frontend'],
        estimatedDuration: 90,
        required: true,
        order: 8
      },
      {
        id: 'testing',
        name: 'Testing and Quality Assurance',
        description: 'Perform comprehensive testing and quality checks',
        type: 'testing',
        dependencies: ['setup_deployment'],
        estimatedDuration: 120,
        required: true,
        order: 9
      },
      {
        id: 'deployment',
        name: 'Deploy to Production',
        description: 'Deploy the application to production environment',
        type: 'deployment',
        dependencies: ['testing'],
        estimatedDuration: 60,
        required: true,
        order: 10
      }
    ]);

    // Automation planning template
    this.templates.set('automation', [
      {
        id: 'analyze_requirements',
        name: 'Analyze Automation Requirements',
        description: 'Understand the process to be automated and its requirements',
        type: 'analysis',
        dependencies: [],
        estimatedDuration: 60,
        required: true,
        order: 1
      },
      {
        id: 'design_workflow',
        name: 'Design Workflow',
        description: 'Design the automation workflow and decision logic',
        type: 'planning',
        dependencies: ['analyze_requirements'],
        estimatedDuration: 90,
        required: true,
        order: 2
      },
      {
        id: 'setup_integrations',
        name: 'Setup Integrations',
        description: 'Configure integrations with external systems and APIs',
        type: 'integration',
        dependencies: ['design_workflow'],
        estimatedDuration: 120,
        required: true,
        order: 3
      },
      {
        id: 'create_workflow',
        name: 'Create Automation Workflow',
        description: 'Build the automation workflow using n8n or similar tool',
        type: 'development',
        dependencies: ['setup_integrations'],
        estimatedDuration: 180,
        required: true,
        order: 4
      },
      {
        id: 'setup_monitoring',
        name: 'Setup Monitoring and Alerts',
        description: 'Configure monitoring, logging, and alerting systems',
        type: 'infrastructure',
        dependencies: ['create_workflow'],
        estimatedDuration: 90,
        required: true,
        order: 5
      },
      {
        id: 'testing_automation',
        name: 'Test Automation',
        description: 'Test the automation workflow with various scenarios',
        type: 'testing',
        dependencies: ['setup_monitoring'],
        estimatedDuration: 120,
        required: true,
        order: 6
      },
      {
        id: 'deploy_automation',
        name: 'Deploy Automation',
        description: 'Deploy the automation to production environment',
        type: 'deployment',
        dependencies: ['testing_automation'],
        estimatedDuration: 60,
        required: true,
        order: 7
      }
    ]);
  }

  /**
   * Create an execution plan for a project
   */
  public async createPlan(
    projectId: string,
    projectType: ProjectType,
    requirements: Map<string, any>
  ): Promise<ExecutionPlan> {
    spectreLogger.success('planner', 'plan_creation_started', undefined, projectId,
      `Creating execution plan for ${projectType} project`, 'planning_in_progress');

    const template = this.templates.get(projectType);
    if (!template) {
      throw new Error(`No template found for project type: ${projectType}`);
    }

    // Create steps based on template and requirements
    const steps = this.customizeSteps(template, requirements);

    const plan: ExecutionPlan = {
      id: `plan_${projectId}_${Date.now()}`,
      projectId,
      projectType,
      steps,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDuration: this.calculateTotalDuration(steps),
      requirements
    };

    this.plans.set(plan.id, plan);

    spectreLogger.success('planner', 'plan_created', undefined, projectId,
      `Execution plan created with ${steps.length} steps`, 'plan_ready_for_review');

    return plan;
  }

  /**
   * Customize steps based on project requirements
   */
  private customizeSteps(template: ExecutionStep[], requirements: Map<string, any>): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    for (const step of template) {
      // Check if step should be included based on requirements
      if (this.shouldIncludeStep(step, requirements)) {
        steps.push({
          ...step,
          id: `${step.id}_${Date.now()}`,
          estimatedDuration: this.adjustDuration(step, requirements)
        });
      }
    }

    return steps;
  }

  /**
   * Determine if a step should be included
   */
  private shouldIncludeStep(step: ExecutionStep, requirements: Map<string, any>): boolean {
    // Always include required steps
    if (step.required) {
      return true;
    }

    // Check specific requirements for optional steps
    switch (step.id) {
      case 'setup_cms':
        return requirements.has('cms') && requirements.get('cms') === true;
      case 'setup_monitoring':
        return requirements.has('monitoring') && requirements.get('monitoring') === true;
      default:
        return true;
    }
  }

  /**
   * Adjust step duration based on requirements
   */
  private adjustDuration(step: ExecutionStep, requirements: Map<string, any>): number {
    let duration = step.estimatedDuration;

    // Adjust based on complexity
    if (requirements.has('complexity')) {
      const complexity = requirements.get('complexity');
      if (complexity === 'high') {
        duration *= 1.5;
      } else if (complexity === 'low') {
        duration *= 0.8;
      }
    }

    return Math.round(duration);
  }

  /**
   * Calculate total estimated duration
   */
  private calculateTotalDuration(steps: ExecutionStep[]): number {
    return steps.reduce((total, step) => total + step.estimatedDuration, 0);
  }

  /**
   * Get a plan by ID
   */
  public async getPlan(planId: string): Promise<ExecutionPlan | null> {
    return this.plans.get(planId) || null;
  }

  /**
   * Update a plan
   */
  public async updatePlan(planId: string, updates: Partial<ExecutionPlan>): Promise<ExecutionPlan> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const updatedPlan: ExecutionPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date()
    };

    this.plans.set(planId, updatedPlan);

    spectreLogger.success('planner', 'plan_updated', undefined, plan.projectId,
      `Execution plan updated`, 'plan_modified');

    return updatedPlan;
  }

  /**
   * Approve a plan
   */
  public async approvePlan(planId: string): Promise<ExecutionPlan> {
    return this.updatePlan(planId, { status: 'approved' });
  }

  /**
   * Get all plans for a project
   */
  public async getProjectPlans(projectId: string): Promise<ExecutionPlan[]> {
    return Array.from(this.plans.values()).filter(plan => plan.projectId === projectId);
  }

  /**
   * Add a custom step to a plan
   */
  public async addStep(planId: string, step: ExecutionStep): Promise<ExecutionPlan> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const updatedSteps = [...plan.steps, step];
    return this.updatePlan(planId, { steps: updatedSteps });
  }

  /**
   * Get agent health status
   */
  public async getHealth(): Promise<{ status: string; plans: number; templates: number }> {
    return {
      status: 'healthy',
      plans: this.plans.size,
      templates: this.templates.size
    };
  }
}

// Export singleton instance
export const planner = new PlannerAgent();