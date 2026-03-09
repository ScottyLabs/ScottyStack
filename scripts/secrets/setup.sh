#!/usr/bin/env bash
set -e
source "$(dirname "$0")/../config.sh"
bao login -method=oidc
