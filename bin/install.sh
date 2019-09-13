#!/bin/sh

BASE=/opt/ssl-vpn-extra
CONF=/etc/vpnc
_SRC="$( dirname "$( dirname "$( readlink -f "$0" )" )" )"

set -e

groupadd --system --force -- ssl-vpn

install --verbose -D --mode=0755 "--target-directory=$BASE/bin" -- \
    "$_SRC/bin/ssl-vpn" \
    "$_SRC/bin/ssl-vpn-connect" \
    "$_SRC/bin/ssl-vpn-disconnect"

install --verbose -D --mode=0644 "--target-directory=$BASE/bin" -- \
    "$_SRC/bin/ssl-vpn-connect-wrapper"

install --verbose -D --mode=0755 "--target-directory=$BASE/hooks" -- \
    "$_SRC/hooks/x5-routes.sh"

install --verbose -D --mode=0644 "--target-directory=$BASE/hooks" -- \
    "$_SRC/hooks/vpnc-script.2019-06-06" \
    "$_SRC/hooks/README.hooks.md"

install --verbose -D --mode=0644 "--target-directory=$BASE/sudoers" -- \
    "$_SRC/sudoers"/*

install --verbose --mode=0755 --directory -- \
    "$CONF/pre-init.d" \
    "$CONF/connect.d" \
    "$CONF/post-connect.d" \
    "$CONF/disconnect.d" \
    "$CONF/post-disconnect.d" \
    "$CONF/attempt-reconnect.d" \
    "$CONF/reconnect.d"

install --verbose --mode=0755 "--no-target-directory" -- \
    "$BASE/hooks/vpnc-script.2019-06-06" "$CONF/vpnc-script"

visudo -qcf "$BASE/sudoers/ssl-vpn" && install --verbose "--no-target-directory" -- "$BASE/sudoers/ssl-vpn" "/etc/sudoers.d/ssl-vpn"

_t="/usr/local/bin/ssl-vpn"
[ -f "$_t" -a -L "$_t" ] || ln -sT "$BASE/bin/ssl-vpn" "$_t"

_t="/usr/local/bin/ssl-vpn-disconnect"
[ -f "$_t" -a -L "$_t" ] || ln -sT "$BASE/bin/ssl-vpn-disconnect" "$_t"

_t="$CONF/post-connect.d/x5-routes"
[ -f "$_t" -a -L "$_t" ] || ln -sT "$BASE/hooks/x5-routes.sh" "$_t"

echo ""
echo "Installation finished."
echo ""
echo "You may now use \`ssl-vpn <host> <user>' to connect."
echo "Use \`ssl-vpn-disconnect' to stop session."
echo ""
echo "Please see \`hooks/README.hooks.md' for more information."
