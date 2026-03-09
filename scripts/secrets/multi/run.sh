#!/usr/bin/env bash
# Require to be run from ./pull.sh or ./push.sh.
# Requires that the PROJECT, BAO_MOUNT, APPS, and ENVS arrays are defined.
set -e

# The action is the script name without the .sh extension (either "pull" or "push")
action=$(basename "$0" .sh)

# Handle the case where there is no application and no environment
if [ ${#APPS[@]} -eq 0 ] && [ ${#ENVS[@]} -eq 0 ]; then
  bao_path="$PROJECT"
  env_path=".env"
  "$action" "$bao_path" "$env_path"
  exit 0
fi

# Handle the case where there is no application
if [ ${#APPS[@]} -eq 0 ]; then
  for ENV in "${ENVS[@]}"; do
    bao_path="$PROJECT/$ENV"
    env_path=".env.$ENV"
    "$action" "$env_path" "$bao_path"
  done
  exit 0
fi

# Handle the case where there is no environment
if [ ${#ENVS[@]} -eq 0 ]; then
  for APP in "${APPS[@]}"; do
    bao_path="$PROJECT/$APP"
    env_path="apps/$APP/.env"
    "$action" "$env_path" "$bao_path"
  done
  exit 0
fi

# Handle the case where there is at least one application and one environment
for APP in "${APPS[@]}"; do
  echo -e "${BOLD_TEXT}==================================================${RESET_TEXT}"
  echo -e "${BOLD_TEXT}${action} secrets for $APP${RESET_TEXT}"
  echo -e "${BOLD_TEXT}==================================================${RESET_TEXT}"
  for ENV in "${ENVS[@]}"; do
    echo
    bao_path="$PROJECT/$ENV/$APP"
    env_path="apps/$APP/.env.$ENV"
    "$action" "$env_path" "$bao_path"
  done
  echo
done
