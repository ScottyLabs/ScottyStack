#!/usr/bin/env bash
set -e
source "$(dirname "$0")/shared/constants.sh" # load VAULT_ADDR variable
vault login -method=oidc
