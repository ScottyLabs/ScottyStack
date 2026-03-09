#!/usr/bin/env bash
# Requires that the VAULT_MOUNT is defined.
set -e

push() {
  local env_path="$1"
  local vault_path="$2"
  echo -e "${BLUE_TEXT}Pushing from \"$env_path\" to \"$VAULT_MOUNT/$vault_path\"${RESET_TEXT}"
  cat $env_path | xargs -r vault kv put -mount="$VAULT_MOUNT" "$vault_path"
}
