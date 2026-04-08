import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LlmService {
  private client: OpenAI;
  private model: string;
  private activeCalls = 0;
  private readonly maxConcurrent = 6;
  private waitQueue: Array<() => void> = [];

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      baseURL: this.configService.getOrThrow('LLM_BASE_URL'),
      apiKey: this.configService.getOrThrow('LLM_API_KEY'),
    });
    this.model =
      this.configService.get('LLM_MODEL') || 'claude-haiku-4-5-20251001';
  }

  async chat(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    await this.acquire();
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 4096,
      });
      return response.choices[0]?.message?.content || '';
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.activeCalls < this.maxConcurrent) {
      this.activeCalls++;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waitQueue.push(resolve));
  }

  private release(): void {
    this.activeCalls--;
    const next = this.waitQueue.shift();
    if (next) {
      this.activeCalls++;
      next();
    }
  }
}
