#!/usr/bin/env zsh
set -e

# Install Bun for JavaScript package management:
# https://bun.com/get
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >>~/.zshrc

# Activate Bun completions in zsh on startup
if ! grep -q 'source <(SHELL=zsh bun completions)' ~/.zshrc; then
  echo 'source <(SHELL=zsh bun completions)' >>~/.zshrc
fi

# Install Bun dependencies
bun install

# Build API
bun run build:api

# Run db migrations
cd apps/server && bun run db:migrate

# Install shfmt for shell script formatting
# https://formulae.brew.sh/formula/shfmt
brew install shfmt

# Install editorconfig-checker for linting with EditorConfig
# https://github.com/editorconfig-checker/editorconfig-checker?tab=readme-ov-file#6-using-homebrew
brew install editorconfig-checker

# Install OpenBao for secret management.
# Removes the `brew info openbao` command due to errors.
# https://openbao.org/docs/install/
brew install openbao

# Set up environment variables
bun run secrets:setup
bun run secrets:pull all all
