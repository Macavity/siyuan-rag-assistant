# SiYuan RAG Assistant - AI Coding Instructions

## Project Overview

This is a **SiYuan Note** plugin (`siyuan-rag-assistant`) that integrates local LLMs (via Ollama) for Retrieval Augmented Generation (RAG). It allows users to chat with their notes.

## Architecture & Core Components

- **Entry Point**: `src/index.ts` defines `RAGAssistantPlugin` (extends `Plugin` from `siyuan`). Handles lifecycle (`onload`, `onunload`), settings, and event listeners.
- **UI Entry**: `src/main.ts` mounts the Vue 3 application to the DOM (`#siyuan-rag-assistant`).
- **State Management**: **Pinia** is used for state (e.g., `src/stores/document-context.ts` tracks the active document).
- **API Layer**: `src/api.ts` wraps SiYuan's kernel API calls. **Always use this wrapper** instead of raw `fetch`.
- **Services**: `src/services/` contains external integrations (e.g., `ollama.ts`).
- **Components**: Vue 3 components in `src/components/`. `ChatInterface.vue` is the main view.

## Tech Stack & Conventions

- **Framework**: Vue 3 (Composition API with `<script setup>`) + TypeScript.
- **Build**: Vite (`vite.config.ts`).
- **Testing**: Vitest (`vitest.config.ts`).
- **Styling**: SCSS (`sass` is installed). Use scoped styles in `.vue` files.
- **I18n**: Localization files in `src/i18n/` (`en_US.json`, `zh_CN.json`).

## Key Workflows

- **Development**: `pnpm dev` (runs `vite build --watch`).
- **Build**: `pnpm build` (production build).
- **Test**: `pnpm test` (runs Vitest).
- **Lint**: `pnpm lint` (ESLint).

## Coding Guidelines

1.  **SiYuan API**:
    - Use `src/api.ts` for all interactions with SiYuan (file tree, blocks, SQL, etc.).
    - If a new API endpoint is needed, add a typed wrapper function to `src/api.ts`.
    - Use `sql()` helper in `src/api.ts` for querying the database.

2.  **Vue Components**:
    - Use `<script setup lang="ts">`.
    - Keep logic in `composables/` if reusable (e.g., `useChatHistory.ts`).
    - Use `siyuan` package types (`Plugin`, `IProtyle`, `Block`, etc.).

3.  **Plugin Lifecycle**:
    - `onload()`: Initialize services, register events (`this.eventBus.on`), and mount UI.
    - `onunload()`: Clean up resources and unmount UI (`destroy()` in `src/main.ts`).
    - **Context Tracking**: The plugin listens to `SiyuanEvents.SWITCH_PROTYLE` in `src/index.ts` to update the current document context in the Pinia store.

4.  **Ollama Integration**:
    - Logic resides in `src/services/ollama.ts`.
    - Ensure error handling for connection failures (user might not have Ollama running).

## Common Patterns

- **Event Bus**: Use `this.eventBus` (from `Plugin` class) to listen to SiYuan events.
- **Settings**: Managed via `src/components/SettingsDialog.vue` and stored using `this.saveData`/`this.loadData`.
- **Icons**: SVG icons are defined in `src/utils/icons.ts` and registered in `onload`.

## File Structure Highlights

- `plugin.json`: Plugin metadata (version, name, permissions).
- `src/types/`: TypeScript definitions (API responses, settings interfaces).
- `scripts/`: Node.js scripts for release and version management.
