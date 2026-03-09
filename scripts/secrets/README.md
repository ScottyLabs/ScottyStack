# Secrets Sync Scripts

This directory contains scripts that are used to manage the project's secrets
using [OpenBao](https://github.com/ScottyLabs/wiki/wiki/Credentials#openbao).

## Quick Start

Log into OpenBao by running the following command. Copy the link from the terminal
and paste it in your browser if the link doesn't automatically open.

```zsh
./setup.sh
```

Run the following commands read the help message for pulling/pushing secrets
for multiple applications and environments from local env files to
[OpenBao](https:/bao.scottylabs.org).

```zsh
./pull.sh
./push.sh
```

### Configuration Variables

The PROJECT (required) is the team slug you defined in
[Governance](https://github.com/ScottyLabs-Labrador/governance/tree/main/teams).

The APPS (optional) is a space-separated string of valid applications. Each
application is a directory in the `apps` directory.

The ENVS (optional) is a space-separated string of valid environments.
Each environment will create a `.env.$ENV` file in the root directory.

### Syncing Behavior

When there is at least one application and one environment, the scripts
sync local secrets from `apps/$APP/.env.$ENV` to the bao path
`$BAO_MOUNT/$PROJECT/$ENV/$APP`, for every application and environment.

When there is no application, the scripts sync local secrets from `.env.$ENV`
to the bao path `$BAO_MOUNT/$PROJECT/$ENV`, for every environment.

When there is no environment, the scripts sync local secrets from `apps/$APP/.env`
to the in the bao path `$BAO_MOUNT/$PROJECT/$APP`, for every application.

When there is no application and no environment, the scripts sync local secrets
from `.env` to the bao path `$BAO_MOUNT/$PROJECT`.
This script contains the configuration and helper functions used by the other scripts,
including argument parsing and validation.
