#!/usr/bin/env bash
set -e

# Load shared variables
source "$(dirname "$0")/../shared/constants.sh"

# Usage message
usage() {
  local script_name="$0"

  # the action is the script name without the .sh extension (either "pull" or "push")
  local action="$(basename "$script_name" .sh)"

  echo
  echo -e "${BOLD_TEXT}Usage:${RESET_TEXT}"
  echo -e "  $script_name ENV_PATH VAULT_PATH"
  echo
  echo -e "${BOLD_TEXT}Description:${RESET_TEXT}"

  if [ "$action" == "pull" ]; then
    echo -e "  ${action} secrets from Vault to the local environment."
  else
    echo -e "  ${action} secrets from the local environment to Vault."
  fi

  echo
  echo -e "${BOLD_TEXT}Arguments:${RESET_TEXT}"

  if [ "$action" == "pull" ]; then
    echo -e "  ENV_PATH     The local environment file to ${action} into"
    echo -e "  VAULT_PATH   The Vault path in $VAULT_MOUNT to ${action} from"
  else
    echo -e "  ENV_PATH     The local environment file to ${action} from"
    echo -e "  VAULT_PATH   The Vault path in $VAULT_MOUNT to ${action} into"
  fi

  echo
  echo -e "${BOLD_TEXT}Options:${RESET_TEXT}"
  echo -e "  -h, --help    Show this help message and exit"
  echo
  echo -e "${BOLD_TEXT}Example Usage:${RESET_TEXT}"
  echo -e "  PROJECT=my-project $script_name .env cmueats"
}

parse_args() {
  unset ENV_PATH VAULT_PATH

  # Read the arguments
  while [[ "$#" -gt 0 ]]; do
    # Show help message and exit if the user passes the -h or --help flag
    case "$1" in -h | --help)
      usage
      exit 0
      ;;
    esac

    # The first argument is the local environment file and the second argument is the Vault path
    # Show an error message and exit if the user passes in more than two arguments.
    if [[ -z "$ENV_PATH" ]]; then
      ENV_PATH="$1"
    elif [[ -z "$VAULT_PATH" ]]; then
      VAULT_PATH="$1"
    else
      echo -e "${RED_TEXT}Error: Too many arguments provided${RESET_TEXT}" >&2
      usage >&2
      exit 1
    fi

    shift
  done

  # Show an error message and exit if the user does not provide an application or environment
  if [ -z "$ENV_PATH" ]; then
    echo -e "${RED_TEXT}Error: Environment path is required${RESET_TEXT}" >&2
    usage >&2
    exit 1
  fi

  if [ -z "$VAULT_PATH" ]; then
    echo -e "${RED_TEXT}Error: Vault path is required${RESET_TEXT}" >&2
    usage >&2
    exit 1
  fi
}
