# SystemD interoperation issues

For correct hooks interoperation with systemd-resolved, add a line to the
/etc/nsswitch.conf:

```
hosts_for_vpnc: resolve
```

This is needed because vpnc-script check for `grep -E "^hosts" | grep -v "resolve"`
to detect presence of systemd-resolved. Which is not quite true, but satisfiable.

# `vpnc-script` updates

If issues arise, grab an updated script at the
http://git.infradead.org/users/dwmw2/vpnc-scripts.git/blob_plain/HEAD:/vpnc-script
