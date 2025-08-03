/**
 * Prompt configuration for different LLM providers
 * This file manages which prompts to use for each provider and prompt type
 */

import { baseGenerationPrompt } from '../generation/base';
import { groqGenerationPrompt } from '../generation/groq';
import { baseRefinementPrompt } from '../refinement/base';

export type PromptType = 'generation' | 'refinement';
export type ProviderId = 'openai' | 'anthropic' | 'groq';

export interface PromptConfig {
  generation: string;
  refinement: string;
}

/**
 * Provider-specific prompt configurations
 * Each provider can have different prompts optimized for their specific model behavior
 */
export const promptConfigs: Record<ProviderId, PromptConfig> = {
  openai: {
    generation: baseGenerationPrompt,
    refinement: baseRefinementPrompt,
  },
  anthropic: {
    generation: baseGenerationPrompt,
    refinement: baseRefinementPrompt,
  },
  groq: {
    generation: groqGenerationPrompt, // Uses specialized prompt for better JSON formatting
    refinement: baseRefinementPrompt,
  },
};

/**
 * Get the appropriate prompt for a given provider and type
 */
export function getPrompt(providerId: ProviderId, type: PromptType): string {
  const config = promptConfigs[providerId];
  if (!config) {
    throw new Error(`No prompt configuration found for provider: ${providerId}`);
  }
  
  return config[type];
}

/**
 * Add or update a prompt configuration for a specific provider
 */
export function setPromptConfig(
  providerId: ProviderId, 
  type: PromptType, 
  prompt: string
): void {
  if (!promptConfigs[providerId]) {
    promptConfigs[providerId] = {
      generation: baseGenerationPrompt,
      refinement: baseRefinementPrompt,
    };
  }
  
  promptConfigs[providerId][type] = prompt;
}

/**
 * Get all available prompt configurations
 */
export function getAllPromptConfigs(): Record<ProviderId, PromptConfig> {
  return { ...promptConfigs };
}