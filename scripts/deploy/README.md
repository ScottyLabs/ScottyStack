# Deploy Scripts

This directory contains scripts that are used to deploy environment variables
to [Railway](https://railway.app).

## Quick Start

Run the following command to read the help message for pushing environment
variables from local env files to Railway.

```zsh
./push-env.sh
```

### Configuration Variables

The RAILWAY_PROJECT is the Railway project ID to push to.

The RAILWAY_SERVICE_PREFIX is the name prefix for each Railway service.
Feel free to set it to an empty string if you don't want to use a prefix.

The APPS is a space-separated string of valid applications. Each
application is a directory in the `apps` directory.

The ENVS is a space-separated string of valid environments.
