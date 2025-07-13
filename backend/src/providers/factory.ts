import { ILLMProvider, LLMProvider, LLMProviderType } from '../types';
import { PROVIDER_CONFIGS } from '../config';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import config from '../config';

export class LLMProviderFactory {
  private providers: Map<string, ILLMProvider> = new Map();
  private static instance: LLMProviderFactory;

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): LLMProviderFactory {
    if (!LLMProviderFactory.instance) {
      LLMProviderFactory.instance = new LLMProviderFactory();
    }
    return LLMProviderFactory.instance;
  }

  private initializeProviders(): void {
    console.log('inside initializeProviders');

    // Initialize OpenAI provider
    if (config.llmProviders.openai?.apiKey) {
      this.providers.set('openai', new OpenAIProvider());
    }

    // Initialize Anthropic provider
    if (config.llmProviders.anthropic?.apiKey) {
      console.log('anthropic provider is initialized');
      this.providers.set('anthropic', new AnthropicProvider());
    }

    // TODO: Add Google and Ollama providers
  }

  getProvider(providerId: string): ILLMProvider | null {
    return this.providers.get(providerId) || null;
  }

  getAvailableProviders(): LLMProvider[] {
    const availableProviders: LLMProvider[] = [];

    for (const [providerId, provider] of this.providers) {
      const config = PROVIDER_CONFIGS[providerId as LLMProviderType];
      if (config) {
        availableProviders.push({
          ...config,
          isAvailable: true,
        });
      }
    }

    return availableProviders;
  }

  getAllProviderConfigs(): LLMProvider[] {
    return Object.values(PROVIDER_CONFIGS).map(config => ({
      ...config,
      isAvailable: this.providers.has(config.id),
    }));
  }

  async validateProviderApiKey(providerId: string, apiKey: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }

    return provider.validateApiKey(apiKey);
  }

  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  getDefaultProvider(): ILLMProvider | null {
    const defaultProviderId = config.defaultLLMProvider;
    
    // Try to get the configured default provider
    let provider = this.providers.get(defaultProviderId);
    if (provider) {
      return provider;
    }

    // Fallback to any available provider
    if (this.providers.size > 0) {
      const firstProvider = this.providers.values().next().value;
      return firstProvider || null;
    }

    return null;
  }

  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  registerProvider(provider: ILLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  removeProvider(providerId: string): boolean {
    return this.providers.delete(providerId);
  }
}

// Export a singleton instance
export const llmProviderFactory = LLMProviderFactory.getInstance(); 