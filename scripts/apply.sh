#!/usr/bin/env bash
set -e

echo
echo -e "${BOLD_TEXT}##################################################${RESET_TEXT}"
echo -e "${BOLD_TEXT}#         [1/2] Pushing env file to OpenBao      #${RESET_TEXT}"
echo -e "${BOLD_TEXT}##################################################${RESET_TEXT}"
echo
"$(dirname "$0")/secrets/push.sh" "$@"

echo
echo -e "${BOLD_TEXT}##################################################${RESET_TEXT}"
echo -e "${BOLD_TEXT}#         [2/2] Pushing env file to Railway      #${RESET_TEXT}"
echo -e "${BOLD_TEXT}##################################################${RESET_TEXT}"
echo
"$(dirname "$0")/deploy/secrets.sh" "$@"
