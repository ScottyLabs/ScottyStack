#!/usr/bin/env bash
set -e
source "$(dirname "$0")/../config.sh"
vault login -method=oidc
