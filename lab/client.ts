import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY not set — copy .env.example to .env.local and add your key');
}

export const anthropic = new Anthropic();
export const SONNET = 'claude-sonnet-4-6';
export const HAIKU = 'claude-haiku-4-5-20251001';
