@ECHO OFF

route /p ADD 85.115.249.1 %~1
route /p ADD 85.115.249.2 %~1
route /p ADD 85.115.249.3 %~1
route /p ADD 85.115.249.4 %~1
route /p ADD 91.206.100.0/23 %~1
route /p ADD 193.232.108.0/24 %~1
REM route /p ADD 195.42.96.0/23 %~1

route /p ADD 192.168.66.131 %~1
route /p ADD 192.168.129.5 %~1
route /p ADD 192.168.32.0/24 %~1
route /p ADD 192.168.129.0/24 %~1
route /p ADD 192.168.181.0/24 %~1
route /p ADD 192.168.191.0/24 %~1
route /p ADD 192.168.238.0/24 %~1
route /p ADD 192.168.239.0/24 %~1

route /p ADD 172.18.236.0/22 %~1
