#!/usr/bin/env bash
set -e

# Load the deploy config
source "$(dirname "$0")/config.sh"

# Load the parser and parse the arguments
source "$(dirname "$0")/../parser.sh"
parse_args "Push environment variables from local env files to Railway." "$@"

# Push a single .env file to Railway
push() {
  local env_path="$1"
  local app="$2"
  local env="$3"

  echo -e "${BLUE_TEXT}Pushing from \"$env_path\" to Railway ($app / $env)${RESET_TEXT}"
  railway link -p "$PROJECT" -s "$app" -e "$env"

  unset RAILWAY_SET_ARGS
  while IFS='=' read -r key value || [ -n "$key" ]; do
    RAILWAY_SET_ARGS+=" --set $key=${value//\"/}"
  done <"$env_path"

  railway variables$RAILWAY_SET_ARGS
}

# Push env vars for each app/env combination
for APP in "${APPS[@]}"; do
  echo -e "${BOLD_TEXT}==================================================${RESET_TEXT}"
  echo -e "${BOLD_TEXT}push env for $APP${RESET_TEXT}"
  echo -e "${BOLD_TEXT}==================================================${RESET_TEXT}"
  for ENV in "${ENVS[@]}"; do
    echo
    push "apps/$APP/.env.$ENV" "$RAILWAY_SERVICE_PREFIX$APP" "$ENV"
  done
  echo
done
