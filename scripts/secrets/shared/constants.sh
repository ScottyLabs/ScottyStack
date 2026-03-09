#!/usr/bin/env bash
set -e

# Set shared variables
export VAULT_ADDR=https://secrets.scottylabs.org
export VAULT_MOUNT=ScottyLabs

export RED_TEXT="\033[31m"
export BLUE_TEXT="\033[34m"
export BOLD_TEXT="\033[1m"
export RESET_TEXT="\033[0m"

export APPLICANTS_ENV_NAME="applicants"
