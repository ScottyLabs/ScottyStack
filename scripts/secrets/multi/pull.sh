#!/usr/bin/env bash
set -e

# Load the config and shared variables
source "$(dirname "$0")/../../config.sh"
source "$(dirname "$0")/../shared/constants.sh"

# Load the parser
source "$(dirname "$0")/parser.sh"

# Parse the arguments
parse_args "$@"

# Load the pull function
source "$(dirname "$0")/../shared/pull-util.sh"

# Run the pull
source "$(dirname "$0")/run.sh"
