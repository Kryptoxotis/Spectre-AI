/**
 * Validator Agent
 * Confirms project is complete and functioning
 */

import { Agent, ExecutionPlan, ProjectStatus } from '@/utils/types';
import { spectreLogger } from '@/core/logger';

/**
 * Validator Agent Implementation
 */
class ValidatorAgent implements Agent {
  public readonly name = 'validator';
  public readonly description = 'Confirms project is complete and functioning';
  public readonly version = '1.0.0';

  private validations: Map<string, any> = new Map();

  /**
   * Validate a completed project
   */
  public async validateProject(plan: ExecutionPlan, projectId: string): Promise<{
    valid: boolean;
    issues: string[];
    score: number;
    recommendations: string[];
  }> {
    spectreLogger.success('validator', 'project_validation_started', undefined, projectId,
      `Starting project validation`, 'validation_in_progress');

    try {
      const validation = await this.performValidation(plan, projectId);
      
      if (validation.valid) {
        spectreLogger.success('validator', 'project_validation_passed', undefined, projectId,
          `Project validation passed with score ${validation.score}`, 'validation_successful');
      } else {
        spectreLogger.failure('validator', 'project_validation_failed', 
          validation.issues.join(', '), projectId, 'Project validation',
          'Project validation failed', 'validation_failed');
      }

      return validation;
    } catch (error) {
      spectreLogger.failure('validator', 'project_validation_error', 
        error instanceof Error ? error.message : String(error), projectId, 'Project validation',
        'Project validation error', 'validation_error');
      
      return {
        valid: false,
        issues: ['Validation process failed'],
        score: 0,
        recommendations: ['Retry validation process']
      };
    }
  }

  /**
   * Perform the actual validation
   */
  private async performValidation(plan: ExecutionPlan, projectId: string): Promise<{
    valid: boolean;
    issues: string[];
    score: number;
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Validate based on project type
    switch (plan.projectType) {
      case 'website':
        score = await this.validateWebsite(plan, issues, recommendations);
        break;
      case 'automation':
        score = await this.validateAutomation(plan, issues, recommendations);
        break;
      default:
        score = await this.validateGeneric(plan, issues, recommendations);
    }

    return {
      valid: score >= 85,
      issues,
      score: Math.round(score),
      recommendations
    };
  }

  /**
   * Validate website projects
   */
  private async validateWebsite(
    plan: ExecutionPlan, 
    issues: string[], 
    recommendations: string[]
  ): Promise<number> {
    let score = 100;

    // Check if all required steps are completed
    const requiredSteps = plan.steps.filter(step => step.required);
    const completedSteps = requiredSteps.filter(step => step.status === 'completed');
    
    if (completedSteps.length < requiredSteps.length) {
      const missing = requiredSteps.length - completedSteps.length;
      issues.push(`${missing} required steps not completed`);
      score -= missing * 10;
    }

    // Check for essential website features
    const hasBackend = plan.steps.some(step => step.name.includes('Backend'));
    const hasFrontend = plan.steps.some(step => step.name.includes('Frontend'));
    const hasDeployment = plan.steps.some(step => step.name.includes('Deploy'));

    if (!hasBackend) {
      issues.push('Backend implementation missing');
      score -= 20;
      recommendations.push('Implement backend API');
    }

    if (!hasFrontend) {
      issues.push('Frontend implementation missing');
      score -= 20;
      recommendations.push('Implement frontend interface');
    }

    if (!hasDeployment) {
      issues.push('Deployment configuration missing');
      score -= 15;
      recommendations.push('Configure deployment pipeline');
    }

    // Check for testing
    const hasTesting = plan.steps.some(step => step.type === 'testing');
    if (!hasTesting) {
      issues.push('Testing not implemented');
      score -= 10;
      recommendations.push('Add comprehensive testing');
    }

    // Check for security considerations
    const hasSecurity = plan.steps.some(step => 
      step.name.includes('Security') || step.name.includes('Authentication')
    );
    if (!hasSecurity) {
      issues.push('Security measures not implemented');
      score -= 15;
      recommendations.push('Implement security measures');
    }

    return Math.max(0, score);
  }

  /**
   * Validate automation projects
   */
  private async validateAutomation(
    plan: ExecutionPlan, 
    issues: string[], 
    recommendations: string[]
  ): Promise<number> {
    let score = 100;

    // Check for workflow design
    const hasWorkflow = plan.steps.some(step => step.name.includes('Workflow'));
    if (!hasWorkflow) {
      issues.push('Workflow design missing');
      score -= 25;
      recommendations.push('Design automation workflow');
    }

    // Check for integrations
    const hasIntegrations = plan.steps.some(step => step.type === 'integration');
    if (!hasIntegrations) {
      issues.push('System integrations missing');
      score -= 20;
      recommendations.push('Configure system integrations');
    }

    // Check for monitoring
    const hasMonitoring = plan.steps.some(step => step.name.includes('Monitoring'));
    if (!hasMonitoring) {
      issues.push('Monitoring not configured');
      score -= 15;
      recommendations.push('Setup monitoring and alerts');
    }

    // Check for testing
    const hasTesting = plan.steps.some(step => step.type === 'testing');
    if (!hasTesting) {
      issues.push('Automation testing missing');
      score -= 15;
      recommendations.push('Add automation testing');
    }

    // Check for error handling
    const hasErrorHandling = plan.steps.some(step => 
      step.name.includes('Error') || step.name.includes('Recovery')
    );
    if (!hasErrorHandling) {
      issues.push('Error handling not implemented');
      score -= 10;
      recommendations.push('Implement error handling');
    }

    return Math.max(0, score);
  }

  /**
   * Validate generic projects
   */
  private async validateGeneric(
    plan: ExecutionPlan, 
    issues: string[], 
    recommendations: string[]
  ): Promise<number> {
    let score = 100;

    // Basic completion check
    const totalSteps = plan.steps.length;
    const completedSteps = plan.steps.filter(step => step.status === 'completed').length;
    
    if (completedSteps < totalSteps) {
      const incomplete = totalSteps - completedSteps;
      issues.push(`${incomplete} steps not completed`);
      score -= incomplete * 5;
      recommendations.push('Complete all planned steps');
    }

    // Check for planning
    const hasPlanning = plan.steps.some(step => step.type === 'planning');
    if (!hasPlanning) {
      issues.push('Planning phase missing');
      score -= 10;
      recommendations.push('Include planning phase');
    }

    return Math.max(0, score);
  }

  /**
   * Get agent health status
   */
  public async getHealth(): Promise<{ status: string; validations: number }> {
    return {
      status: 'healthy',
      validations: this.validations.size
    };
  }
}

// Export singleton instance
export const validator = new ValidatorAgent();