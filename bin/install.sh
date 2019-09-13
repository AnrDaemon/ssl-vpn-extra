#!/bin/sh -x

BASE=/opt/ssl-vpn-extra
_SRC="$( dirname "$( dirname "$( readlink -f "$0" )" )" )"

set -e

groupadd --system --force -- ssl-vpn

install --verbose -D --mode=0755 "--target-directory=$BASE/bin" -- "$_SRC/bin/"*
install --verbose -D --mode=0755 "--target-directory=$BASE/hooks" -- "$_SRC/hooks/"*
install --verbose -D --mode=0644 "--target-directory=$BASE/sudoers" -- "$_SRC/sudoers/"*
install --verbose --mode=0755 --directory -- /etc/vpnc/{attempt-reconnect,connect,disconnect,post-connect,post-disconnect,pre-init,reconnect}.d

visudo -cf "$_SRC/sudoers/ssl-vpn" && install --verbose -D "--target-directory=/etc/sudoers.d" -- "$_SRC/sudoers/ssl-vpn"

_t="/usr/local/bin/ssl-vpn"
[ -f "$_t" -a -L "$_t" ] || ln -sT "$BASE/bin/ssl-vpn" "$_t"

_t="/usr/local/bin/ssl-vpn-disconnect"
[ -f "$_t" -a -L "$_t" ] || ln -sT "$BASE/bin/ssl-vpn-disconnect" "$_t"

_t="/etc/vpnc/post-connect.d/x5-routes"
[ -f "$_t" -a -L "$_t" ] || ln -sT "$BASE/hooks/x5-routes.sh" "$_t"
