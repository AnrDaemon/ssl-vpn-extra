#!/bin/sh

[ "$NETDEV" ] || exit
[ "$CISCO_DEF_DOMAIN" = "x5.ru" ] || exit

ip route replace 192.168.32.0/24 dev $NETDEV
ip route replace 192.168.129.0/24 dev $NETDEV
ip route replace 192.168.181.0/24 dev $NETDEV
ip route replace 192.168.191.0/24 dev $NETDEV
ip route replace 192.168.239.0/24 dev $NETDEV

ip route delete 192.168.0.0/16 dev $NETDEV
ip route delete 172.16.0.0/12 dev $NETDEV
ip route delete 10.0.0.0/8 dev $NETDEV
