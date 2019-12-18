@ECHO OFF

IF "%~1" == "off" (
    route DELETE 85.115.249.1
    route DELETE 85.115.249.2
    route DELETE 85.115.249.3
    route DELETE 85.115.249.4
    route DELETE 91.206.100.0/23
    route DELETE 193.232.108.0/24
    REM route DELETE 195.42.96.0/23

    route DELETE 192.168.129.5
    route DELETE 192.168.32.0/24
    route DELETE 192.168.66.0/24
    route DELETE 192.168.129.0/24
    route DELETE 192.168.181.0/24
    route DELETE 192.168.191.0/24
    route DELETE 192.168.239.0/24

    route DELETE 172.18.236.0/22
) ELSE (
    route /p ADD 85.115.249.1 %~1
    route /p ADD 85.115.249.2 %~1
    route /p ADD 85.115.249.3 %~1
    route /p ADD 85.115.249.4 %~1
    route /p ADD 91.206.100.0/23 %~1
    route /p ADD 193.232.108.0/24 %~1
    REM route /p ADD 195.42.96.0/23 %~1

    route /p ADD 192.168.129.5 %~1
    route /p ADD 192.168.32.0/24 %~1
    route /p ADD 192.168.66.0/24 %~1
    route /p ADD 192.168.129.0/24 %~1
    route /p ADD 192.168.181.0/24 %~1
    route /p ADD 192.168.191.0/24 %~1
    route /p ADD 192.168.239.0/24 %~1

    route /p ADD 172.18.236.0/22 %~1
)
