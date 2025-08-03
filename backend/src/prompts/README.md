# Prompts Documentation

This directory contains all the prompts used by the LLM providers in the application. The structure is organized for easy maintenance and customization.

## Structure

```
prompts/
├── config/
│   └── index.ts          # Configuration for prompt combinations per provider
├── generation/
│   ├── base.ts          # Default generation prompt
│   └── groq.ts          # Groq-specific generation prompt
├── refinement/
│   └── base.ts          # Default refinement prompt
├── index.ts             # Main exports
└── README.md            # This file
```

## Types of Prompts

### Generation Prompts

These prompts are used to generate clarifying questions from a user's initial prompt. They help the system understand what additional information is needed to refine the prompt.

- **Base Generation**: Works with most LLM providers
- **Groq Generation**: Optimized for Groq's models with stricter JSON formatting requirements

### Refinement Prompts

These prompts take the original prompt and user answers to generate a refined, more specific version of the prompt.

## Usage

### Getting a Prompt

```typescript
import { getPrompt } from '../prompts'

// Get the generation prompt for OpenAI
const prompt = getPrompt('openai', 'generation')

// Get the refinement prompt for Groq
const refinementPrompt = getPrompt('groq', 'refinement')
```

### Adding a New Prompt

1. Create a new file in the appropriate subdirectory
2. Export the prompt as a named constant
3. Update the config to use the new prompt
4. Import and export in the main index.ts

### Customizing Prompts for Providers

Modify the `promptConfigs` object in `config/index.ts`:

```typescript
promptConfigs.newProvider = {
  generation: customGenerationPrompt,
  refinement: customRefinementPrompt,
}
```

## Provider Configuration

Each provider can have different prompts optimized for their specific behavior:

- **OpenAI**: Uses base prompts (balanced approach)
- **Anthropic**: Uses base prompts (balanced approach)
- **Groq**: Uses specialized generation prompt for better JSON formatting

## Best Practices

1. **Test prompts thoroughly** with each provider before deploying
2. **Keep prompts focused** on their specific purpose (generation vs refinement)
3. **Document any provider-specific optimizations** in the prompt files
4. **Use descriptive variable names** for new prompts
5. **Maintain consistent formatting** and style across prompts
