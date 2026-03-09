#!/usr/bin/env bash
set -e

# Load the parser
source "$(dirname "$0")/parser.sh"

# Parse arguments
parse_args "$@"

# Load the push function
source "$(dirname "$0")/../shared/push-util.sh"

# Run the push
source "$(dirname "$0")/run.sh"
