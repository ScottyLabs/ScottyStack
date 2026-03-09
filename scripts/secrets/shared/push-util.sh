#!/usr/bin/env bash
# Requires that the BAO_MOUNT is defined.
set -e

push() {
  local env_path="$1"
  local bao_path="$2"
  echo -e "${BLUE_TEXT}Pushing from \"$env_path\" to \"$BAO_MOUNT/$bao_path\"${RESET_TEXT}"
  cat $env_path | xargs -r bao kv put -mount="$BAO_MOUNT" "$bao_path"
}
