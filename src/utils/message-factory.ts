import {getContextFreeSystemPrompt, getDocumentAwareSystemPrompt} from "@/utils/prompt-templates.ts";
import {Message} from "@/types/message.ts";

/**
 * Get the appropriate system message based on context mode
 */
export function buildContextFreeSystemMessage(): Message {
  return {
    role: 'system',
    content: getContextFreeSystemPrompt()
  }
}

export function buildContextualSystemMessage(): Message{
  return {
    role: 'system',
    content: getDocumentAwareSystemPrompt(),
  }
}

export function buildAssistantMessage(content: string): Message {
  return {
    role: 'assistant',
    content,
  }
}

export function buildUserMessage(userMessage: string): Message {
  return {
    role: 'user',
    content: userMessage
  };
}
