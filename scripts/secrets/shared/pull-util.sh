#!/usr/bin/env bash
# Requires that the VAULT_MOUNT is defined.
set -e

pull() {
  local env_path="$1"
  local vault_path="$2"
  vault_path="$VAULT_MOUNT/$vault_path"
  echo -e "${BLUE_TEXT}Pulling from \"$vault_path\" to \"$env_path\"${RESET_TEXT}"
  vault kv get -format=json "$vault_path" |
    jq -r '.data.data | to_entries[] | "\(.key)=\"\(.value)\""' >$env_path
}
