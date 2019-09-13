#!/bin/sh

# apt-get install openconnect
# echo "hosts_for_vpnc: resolve" | sudo tee -a /etc/nsswitch.conf

UID="$( id -u )"
PID="/run/user/$UID/x5.pid"
eval "$( openconnect --authenticate "--user=${1:-$USER}" -- sslvpn.x5.ru/x5b )"
[ "$COOKIE" ] || ecit
sudo --background --set-home "--prompt=[sudo]OpenConnect worker task: " -- openconnect --background "--pid-file=$PID" --disable-ipv6 --no-dtls "--servercert=$FINGERPRINT" "--cookie=$COOKIE" -- "$HOST"
sudo chown "$UID" "$PID"
