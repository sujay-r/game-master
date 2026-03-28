# AGENTS.md

This file contains essential information for agentic coding agents working in this repository.

## Project Overview

- **Type**: Vue 3 + TypeScript + Vite SPA
- **State Management**: Pinia
- **Backend**: Supabase
- **PWA**: Enabled via vite-plugin-pwa
- **Testing**: Playwright (e2e)
- **Concept**: A life-as-a-game platform that helps the user manage various aspects of their life.

## Build Commands

```bash
# Development
npm run dev              # Start Vite dev server

# Production
npm run build           # Full build (type-check + build)
npm run build-only      # Build without type-checking
npm run type-check      # TypeScript type checking only
npm run preview         # Preview production build
```

## Lint/Format Commands

```bash
npm run lint            # ESLint with auto-fix
npm run format          # Prettier format src/ directory
```

## Testing Commands

```bash
# Run all e2e tests
npm run test:e2e

# Run a specific test file
npx playwright test tests/e2e/specs/task.spec.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests with UI mode
npx playwright test --ui

# Run tests for a specific project
npx playwright test --project="Desktop Chrome"
```

## Code Style Guidelines

### General

- **Indent**: 2 spaces
- **Line width**: 100 characters
- **Semicolons**: No
- **Quotes**: Single
- **Trailing whitespace**: Trimmed
- **Final newline**: Required

### TypeScript

- Use strict type annotations
- Import types with `type` keyword: `import type { Foo } from '@/types/foo'`
- Prefer interfaces over type aliases for object shapes
- Use PascalCase for types/interfaces/enums
- Use camelCase for functions, variables, properties

### Vue Components

- Use `<script setup lang="ts">` syntax
- Use Composition API exclusively
- Props: `defineProps<{ propName: Type }>()`
- Emits: `defineEmits<{ (e: 'eventName', value: Type): void }>()`
- Component names: PascalCase (e.g., `MyComponent.vue`)
- Template: 2-space indent, attributes on new lines if >3 attrs

### Imports

- Order: Vue/core libs → external libs → internal `@/` aliases → relative imports
- Use `@/` alias for all src/ imports
- Example: `import { useStatStore } from '@/stores/resources'`

### Naming Conventions

- **Components**: PascalCase (e.g., `HUDStat.vue`)
- **Stores**: camelCase with `use` prefix (e.g., `useStatStore`)
- **Types/Interfaces**: PascalCase (e.g., `StatType`, `TaskStatus`)
- **Enums**: PascalCase with PascalCase values (e.g., `TaskStatus.Todo`)
- **Files**: PascalCase for components, camelCase for utilities

### Error Handling

- Use try/catch for async operations
- Log errors with context: `console.error('Context: ', err)`
- Re-throw errors after logging when needed
- Store actions should handle their own errors

### State Management (Pinia)

- Define stores with arrow functions for state
- Use actions for async operations
- Access stores via composables in setup functions

### CSS

- Use `scoped` styles in components
- Class names: kebab-case (e.g., `.stat-container`)
- Use CSS variables where appropriate
- Support mobile responsive breakpoints (768px, 480px)

## Project Structure

```
src/
  components/     # Vue components
  views/          # Page-level views
  stores/         # Pinia stores
  types/          # TypeScript type definitions
  lib/            # External service clients (Supabase)
  utils/          # Utility functions
  assets/         # Static assets
  router/         # Vue Router config
```

## Environment Variables

Required in `.env`:

- `VITE_SUPABASE_PROJECT_URL`
- `VITE_SUPABASE_API_KEY`

## Common Patterns

### Adding a New Component

1. Create `.vue` file in `src/components/`
2. Use `<script setup lang="ts">`
3. Define props/emits with TypeScript
4. Add scoped styles
5. Import in parent using `@/components/ComponentName`

### Adding a Store

1. Create in `src/stores/`
2. Use `defineStore()` with state as arrow function
3. Export as `useXxxStore`
4. Import with `@/stores/xxx`

### Database Operations

- Place Supabase calls in `src/lib/supabase.ts`
- Return typed data from lib functions
- Handle errors with try/catch
