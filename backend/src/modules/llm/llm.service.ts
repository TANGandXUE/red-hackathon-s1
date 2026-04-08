import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Semaphore } from '../../common/semaphore';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LlmService {
  private client: OpenAI;
  private model: string;
  private readonly semaphore = new Semaphore(6);

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      baseURL: this.configService.getOrThrow('LLM_BASE_URL'),
      apiKey: this.configService.getOrThrow('LLM_API_KEY'),
    });
    this.model =
      this.configService.get('LLM_MODEL') || 'claude-haiku-4-5-20251001';
  }

  async chat(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    await this.semaphore.acquire();
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 4096,
      });
      return response.choices[0]?.message?.content || '';
    } finally {
      this.semaphore.release();
    }
  }
}
