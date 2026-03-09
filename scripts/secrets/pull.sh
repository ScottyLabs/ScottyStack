#!/usr/bin/env bash
set -e

# Load the secrets specific config
source "$(dirname "$0")/config.sh"

# Parse the arguments
source "$(dirname "$0")/../parser.sh"
parse_args "Pull secrets from OpenBao to the local environment." "$@"

# Define the pull function
pull() {
  local env_path="$1"
  local bao_path="$2"
  bao_path="$BAO_MOUNT/$bao_path"
  echo -e "${BLUE_TEXT}Pulling from \"$bao_path\" to \"$env_path\"${RESET_TEXT}"
  bao kv get -format=json "$bao_path" |
    jq -r '.data.data | to_entries[] | "\(.key)=\"\(.value)\""' >$env_path
}

# Run the pull
source "$(dirname "$0")/run.sh"
