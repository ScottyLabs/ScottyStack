#!/usr/bin/env bash
# Requires that the BAO_MOUNT is defined.
set -e

pull() {
  local env_path="$1"
  local bao_path="$2"
  bao_path="$BAO_MOUNT/$bao_path"
  echo -e "${BLUE_TEXT}Pulling from \"$bao_path\" to \"$env_path\"${RESET_TEXT}"
  bao kv get -format=json "$bao_path" |
    jq -r '.data.data | to_entries[] | "\(.key)=\"\(.value)\""' >$env_path
}
