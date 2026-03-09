# Secrets Sync Scripts

This directory contains scripts that are used to manage the project's secrets
using [Vault](https://github.com/ScottyLabs/wiki/wiki/Credentials#hashicorp-vault).

## Quick Start

Log into the Vault by running the following command.  Copy the link from the terminal
and paste it in your browser if the link doesn't automatically open.

```zsh
./setup.sh
```

Run the following commands to pull and push secrets by specifying a local environment
file and a Vault path in ScottyLabs Vault.

```zsh
./single/pull.sh
./single/push.sh
```

## Advanced Usage

It is tedious to pull/push secrets for each application and environment in a large
project. To simplify this process, we have created the `multi` directory which
contains scripts that are used to manage the project's secrets for multiple
applications and environments.

```zsh
./multi/pull.sh
./multi/push.sh
```

### Configuration Variables

The PROJECT (required) is the team slug you defined in
[Governance](https://github.com/ScottyLabs/governance/tree/main/teams).

The APPS (optional) is a space-separated string of valid applications. Each
application is a directory in the `apps` directory.

The ENVS (optional) is a space-separated string of valid environments.
Each environment will create a `.env.$ENV` file in the root directory.

### Syncing Behavior

When there is at least one application and one environment, the scripts
sync local secrets from `apps/$APP/.env.$ENV` to the vault path
`ScottyLabs/$PROJECT/$ENV/$APP`, for every application and environment.

When there is no application, the scripts sync local secrets from `.env.$ENV`
to the vault path `ScottyLabs/$PROJECT/$ENV`, for every environment.

When there is no environment, the scripts sync local secrets from `apps/$APP/.env`
to the in the vault path `ScottyLabs/$PROJECT/$APP`, for every application.

When there is no application and no environment, the scripts sync local secrets
from `.env` to the vault path `ScottyLabs/$PROJECT`.
This script contains the configuration and helper functions used by the other scripts,
including argument parsing and validation.

**Exception**: when the `ENV` is `applicants`, the local secrets file name will be
`.env` instead of `.env.applicant`.
