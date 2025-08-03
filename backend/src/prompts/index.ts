/**
 * Main exports for the prompts module
 */

// Export all individual prompts
export { baseGenerationPrompt } from './generation/base';
export { groqGenerationPrompt } from './generation/groq';
export { baseRefinementPrompt } from './refinement/base';

// Export configuration system
export {
  getPrompt,
  setPromptConfig,
  getAllPromptConfigs,
  promptConfigs,
  type PromptType,
  type ProviderId,
  type PromptConfig,
} from './config';

// Re-export everything from config for convenience
export * from './config';