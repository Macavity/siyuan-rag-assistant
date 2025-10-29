# SiYuan RAG Assistant

A powerful AI assistant plugin for SiYuan that leverages your documents as context for intelligent conversations using local Ollama GenAI.

## Features

- 🤖 **AI-Powered Assistance**: Chat with an AI assistant powered by local Ollama LLMs
- 📄 **Document-Aware Context**: Automatically uses the content of the currently open document as context
- 📚 **Sub-Document Support**: Optionally include all sub-documents in the same folder as additional context
- 💬 **Per-Document Chat History**: Maintains separate conversation history for each document
- ⚙️ **Flexible Configuration**: Customize model, temperature, and context settings

## Installation

1. Clone this repository
2. Install dependencies: `pnpm i`
3. Copy `.env.example` to `.env` and set your SiYuan workspace path
4. Run `pnpm dev` to build the plugin
5. Restart SiYuan and enable the plugin from Settings → Marketplace

## Setup

### Prerequisites

- [Ollama](https://ollama.ai/) installed and running
- At least one AI model downloaded in Ollama (e.g., `orca2`, `llama2`, `mistral`, `codellama`)

### Configuration

1. Open the plugin settings (click the plugin icon in the sidebar)
2. Configure your Ollama URL (default: `http://localhost:11434`)
3. Select your preferred AI model
4. Adjust temperature if needed (0.1 recommended for accurate responses)
5. Enable "Include Sub Documents" if you want the AI to consider related documents in the same folder

## Usage

1. Open any document in SiYuan
2. Open the RAG Assistant panel
3. Ask questions about the document - the AI will use the document content as context
4. Your conversation history is saved per document, but also deletable.

### Example Questions

- "What is this document about?"
- "Summarize the key points"
- "What are the main tasks listed?"
- "List all the headings in this document"
- "What information is mentioned about X?"

## Settings

- **Context-Free Chats**: When enabled, conversations won't use document context (general AI chat mode)
- **Include Sub Documents**: When enabled, the AI will have access to all documents in the same folder as context

## Development

```bash
# Install dependencies
pnpm i

# Development mode with watch
pnpm dev

# Build for production
pnpm build

# Release new version
pnpm release
```

## License

[Add your license here]

## Credits

Built with SiYuan plugin template using Vite and Vue 3.