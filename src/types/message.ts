export type MessageRole = 'system' | 'user' | 'assistant';

export type Message = {
  role: MessageRole,
  content: string
}
