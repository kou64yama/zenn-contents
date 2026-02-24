# GEMINI.md

## Project Overview

This repository is for managing technical articles and books to be posted on [Zenn](https://zenn.dev/). It utilizes Zenn CLI for local writing and previewing, and Git for content version control and quality management.

### Key Technologies

- **Runtime**: Node.js
- **Package Manager**: pnpm
- **Content Management**: Zenn CLI
- **Quality Control (Lint)**: textlint (with Japanese technical document preset)
- **Formatter**: Prettier
- **Git Hooks**: Husky, lint-staged

## Development & Operation Commands

Key commands required for project execution and management.

### Setup

- `pnpm install`: Install dependencies.
- `pnpm run prepare`: Set up Husky.

### Writing & Previewing

- `npx zenn preview`: Start the preview server, accessible at `http://localhost:8080`.
- `npx zenn new:article`: Create a new article.
- `npx zenn new:book`: Create a new book.

### Quality Control

- `pnpm run lint`: Run textlint on Markdown files under `articles/` and `books/`.
- `npx textlint --fix <file>`: Apply automatic fixes using textlint.

## Development Guidelines

- **Directory Structure**:
  - `articles/`: Stores individual technical articles.
  - `books/`: Stores technical books.
- **Japanese Expression**: To ensure appropriate Japanese for technical documents, adhere to textlint rules (JTF style guide, technical writing presets, etc.).
- **Pre-commit Check**: Husky automatically runs linting on changed Markdown files before committing.

## Special Notes

- Existing published articles are in the `articles/` directory and have `published: true` set in their front matter.
- If using VS Code, recommended extensions (textlint, Prettier) can apply automatic fixes on save.
