/**
 * Agent Registry
 * Exports all agents for use by the orchestrator
 */

import { questioner } from './questioner';
import { planner } from './planner';
import { executor } from './executor';
import { reviewer } from './reviewer';
import { validator } from './validator';

/**
 * Agent registry object
 * Contains all available agents
 */
export const agents = {
  questioner,
  planner,
  executor,
  reviewer,
  validator
};

/**
 * Get all agents as an array
 */
export const getAllAgents = () => Object.values(agents);

/**
 * Get agent by name
 */
export const getAgent = (name: string) => agents[name as keyof typeof agents];

/**
 * Get agent names
 */
export const getAgentNames = () => Object.keys(agents);