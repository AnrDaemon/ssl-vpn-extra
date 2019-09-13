# SSL-VPN wrapper

## Prerequisites

Requires working OpenConnect binary.

## Suite installation

Simply run `bin/install.sh` from root user.
It will create necessary directories and install necessary files.

## Configuration

### Initial setup

For systems with `systemd` init daemon, look in `hooks/README.hooks.md` for integration caveats.

Users who need to connect to the SSL VPN servers should be added to the `ssl-vpn` group or have sudo rights
to run the stage of actual connection to the endpoint.

## Usage

Run `ssl-vpn [ host [ user ] ]`.

If not given, `host` defaults to `$SSL_VPN_HOST`, `user` - to `$SSL_VPN_USER` or,
failing that, to `$USER`.
