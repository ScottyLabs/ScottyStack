#!/usr/bin/env bash
set -e

# Load the parser
source "$(dirname "$0")/parser.sh"

# Parse the arguments
parse_args "$@"

# Load the push function
source "$(dirname "$0")/../shared/push-util.sh"

# Push the secrets
push "$ENV_PATH" "$VAULT_PATH"
