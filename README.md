# Local LLM Integration Plugin for Siyuan

This plugin enables seamless integration of local Large Language Models (LLMs) with Siyuan, using the powerful technique of Retrieval Augmented Generation (RAG). RAG combines your notes and optionally sub-documents as retrieved context to augment the prompt sent to the AI, allowing the model to generate accurate, context-aware responses without manual copy-pasting. This creates a privacy-focused, offline AI experience directly within your knowledge management environment.

## Demo

https://github.com/user-attachments/assets/eb5ad265-a083-4bd5-bcbf-b48a5654c475

## Features

- 🤖 **AI-Powered Assistance**: Chat with an AI assistant powered by local Ollama LLMs
- 📄 **Document-Aware Context**: Automatically uses the content of the currently open document as context
- 📚 **Sub-Document Support**: Optionally include all sub-documents in the same folder as additional context
- 💬 **Per-Document Chat History**: Maintains separate conversation history for each document
- ⚙️ **Flexible Configuration**: Customize model, temperature, and context settings

## Recommended Ollama Models for Multi-Document Tasks

- Llama 3.1 (8B or 70B): State-of-the-art model excellent for deep summarization, analysis, and evaluation.
- Mistral 7B: Efficient and high-performing, balancing speed and accuracy.
- Granite 3.x (8B): Strong accuracy and good efficiency.
- Phi-3 (3.8B): Lightweight but capable, great for resource-constrained setups.
- Gemma 7B: Optimized for conversational and summarization tasks.

Example: `ollama run llama3.1` - downloads Llama 3.1 and makes it available in Siyuan.

## Prerequisites

- [Ollama](https://ollama.ai/) installed and running
- At least one AI model downloaded in Ollama (e.g., `llama3.1`, `mistral`, `codellama`)

### Configuration

1. Open the plugin settings (click the plugin icon in the sidebar)
2. Configure your Ollama URL (default: `http://localhost:11434`)
3. Select your preferred AI model
4. Adjust temperature if needed (0.1 recommended for accurate responses)
5. Enable "Include Sub Documents" if you want the AI to consider child documents in the same folder

## Usage

1. Open any document in SiYuan
2. Open the RAG Assistant panel
3. Ask questions about the document - the AI will use the document content as context
4. Your conversation history is saved per document, but also deletable.

## What is Retrieval Augmented Generation (RAG)?

RAG is an AI technique that improves large language model outputs by retrieving relevant documents from your notes or external sources and including them as context in the prompt. This hybrid approach ensures responses are accurate, current, and grounded in your specific data, reducing hallucinations and enhancing reliability. It’s especially powerful for multi-document summarization, analysis, and evaluation tasks within your personal knowledge base.

### Example Questions

- "What is this document about?"
- "Summarize the key points"
- "What are the main tasks listed?"
- "List all the headings in this document"
- "What information is mentioned about X?"

## Settings

- **Context-Free Chats**: When enabled, conversations won't use document context (general AI chat mode)
- **Include Sub Documents**: When enabled, the AI will have access to all documents in the same folder as context
