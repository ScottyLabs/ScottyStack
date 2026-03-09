#!/usr/bin/env bash
set -e

# Load the config and shared variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/constants.sh"

# Convert space-separated strings to arrays
unset ALLOWED_APPS_ARR ALLOWED_ENVS_ARR
read -r -a ALLOWED_APPS_ARR <<<"$APPS"
read -r -a ALLOWED_ENVS_ARR <<<"$ENVS"

# Usage message with description as the first argument
usage() {
  local script_name="$0"
  local description="$1"

  # the action is the script name without the .sh extension (either "pull" or "push")
  local action="$(basename "$script_name" .sh)"

  # Join the allowed apps and envs into a single string with ' | ' as a separator.
  local allowed_apps_joined="" allowed_envs_joined=""
  if [ "${#ALLOWED_APPS_ARR[@]}" -gt 0 ]; then
    allowed_apps_joined=$(printf '%s | ' "${ALLOWED_APPS_ARR[@]}")
  fi
  if [ "${#ALLOWED_ENVS_ARR[@]}" -gt 0 ]; then
    allowed_envs_joined=$(printf '%s | ' "${ALLOWED_ENVS_ARR[@]}")
  fi

  echo
  echo -e "${BOLD_TEXT}Usage:${RESET_TEXT}"
  echo -e "  $script_name APP ENV"
  echo
  echo -e "${BOLD_TEXT}Description:${RESET_TEXT}"
  echo -e "  $description"
  echo
  echo -e "${BOLD_TEXT}Arguments:${RESET_TEXT}"
  echo -e "  APP   The application to ${action}, one of: ${allowed_apps_joined}all"
  echo -e "  ENV   The environment to ${action}, one of: ${allowed_envs_joined}all"
  echo
  echo -e "${BOLD_TEXT}Options:${RESET_TEXT}"
  echo -e "  -h, --help    Show this help message and exit"
  echo
  echo -e "${BOLD_TEXT}Example Usage:${RESET_TEXT}"
  echo -e "  $script_name all prod"
}

# Helper function to validate the app/env input
validate_input() {
  local input="$1" # the specific value provided by the user
  shift 1
  local allowed_list=("$@") # list of allowed options
  local result=()           # the validated result

  # If the user passes "all", set the target array to the allowed list
  if [ "$input" == "all" ]; then
    result=("${allowed_list[@]}")

  # Otherwise, validate the input against the allowed list
  else
    local valid=false
    for opt in "${allowed_list[@]}"; do
      if [ "$input" == "$opt" ]; then
        result=("$input")
        valid=true
        break
      fi
    done

    # Exit with an error code if the input is not valid
    if [ "$valid" == false ]; then
      echo -e "${RED_TEXT}Error: Invalid input '$input'.${RESET_TEXT}" >&2
      usage >&2
      exit 1
    fi
  fi

  # Print the validated result as a newline-separated list to be captured by the caller
  if [ "${#result[@]}" -gt 0 ]; then
    printf '%s\n' "${result[@]}"
  fi
}

# Shared Argument Parsing and Validation
# The first argument is the description of the script
parse_args() {
  unset APP ENV

  local description="$1"
  shift 1

  # Show an error message and exit if the PROJECT is not defined
  if [ -z "$PROJECT" ]; then
    echo -e "${RED_TEXT}Error: PROJECT is not defined${RESET_TEXT}" >&2
    usage "$description" >&2
    exit 1
  fi

  # Read the arguments
  while [[ "$#" -gt 0 ]]; do
    # Show help message and exit if the user passes the -h or --help flag
    case "$1" in -h | --help)
      usage "$description"
      exit 0
      ;;
    esac

    # The first argument is the application and the second argument is the environment
    # Show an error message and exit if the user passes in more than two arguments.
    if [[ -z "$APP" ]]; then
      APP="$1"
    elif [[ -z "$ENV" ]]; then
      ENV="$1"
    else
      echo -e "${RED_TEXT}Error: Too many arguments provided${RESET_TEXT}" >&2
      usage "$description" >&2
      exit 1
    fi

    shift
  done

  # Show an error message and exit if the user does not provide an application or environment
  if [ -z "$APP" ]; then
    echo -e "${RED_TEXT}Error: Application is required${RESET_TEXT}" >&2
    usage "$description" >&2
    exit 1
  fi

  if [ -z "$ENV" ]; then
    echo -e "${RED_TEXT}Error: Environment is required${RESET_TEXT}" >&2
    usage "$description" >&2
    exit 1
  fi

  # These two arrays now contain the validated applications and environments
  # instead of the allowed applications and environments to be used in other scripts.
  APPS=() ENVS=()

  # Validate the input and store the results in the APPS and ENVS arrays
  # Need to run and store the output in a variable so the script can exit
  # if the input is not valid.
  apps_output=$(validate_input "$APP" "${ALLOWED_APPS_ARR[@]}")
  envs_output=$(validate_input "$ENV" "${ALLOWED_ENVS_ARR[@]}")

  if [ -n "$apps_output" ]; then
    while IFS= read -r line; do
      APPS+=("$line")
    done <<<"$apps_output"
  fi

  if [ -n "$envs_output" ]; then
    while IFS= read -r line; do
      ENVS+=("$line")
    done <<<"$envs_output"
  fi
}
