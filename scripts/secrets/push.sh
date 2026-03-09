#!/usr/bin/env bash
set -e

# Load the parser and parse the arguments
source "$(dirname "$0")/parser.sh"
parse_args "$@" "Push secrets from the local environment to OpenBao."

# Define the push function
push() {
  local env_path="$1"
  local bao_path="$2"
  echo -e "${BLUE_TEXT}Pushing from \"$env_path\" to \"$BAO_MOUNT/$bao_path\"${RESET_TEXT}"
  cat $env_path | xargs -r bao kv put -mount="$BAO_MOUNT" "$bao_path"
}

# Run the push
source "$(dirname "$0")/run.sh"
