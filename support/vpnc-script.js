//
// vpnc-script-win.js
//
// Sets up the Network interface and the routes
// needed by vpnc.
//

// Enables additional functionality (mostly) for debugging purposes
var vDebug = false;

// Polyfills
if (!String.prototype.trim) {
	String.prototype.trim = function () {
	  return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	};
}
if (!String.prototype.trimStart) {
	String.prototype.trimStart = function () {
	  return this.replace(/^[\s\uFEFF\xA0]+/g, '');
	};
}
if (!String.prototype.trimEnd) {
	String.prototype.trimEnd = function () {
	  return this.replace(/[\s\uFEFF\xA0]+$/g, '');
	};
}

// --------------------------------------------------------------
// Initial setup
// --------------------------------------------------------------
var internal_ip4_netmask = "255.255.255.0";

var accumulatedExitCode = 0;

var ws = WScript.CreateObject("WScript.Shell");
var env = ws.Environment("Process");

var oExec = ws.Exec("%ComSpec% /S /C \"chcp.com 65001\" > NUL: 2>&1");
oExec.StdIn.Close();

// FIX configure tricks
var OPENCONNECT_TRICKS = env("OPENCONNECT_TRICKS");

if (env("LOG2FILE")) {
	var fs = WScript.CreateObject("Scripting.FileSystemObject");
	var tmpdir = fs.GetSpecialFolder(2)+"\\";
	var log = fs.OpenTextFile(tmpdir + "vpnc.log", 8, true);
}

// How to add the default internal route
// -1 - Do not touch default route (but do other necessary route setups)
// 0 - As interface gateway when setting properties
// 1 - As a 0.0.0.0/0 route with a lower metric than the default route
// 2 - As 0.0.0.0/1 + 128.0.0.0/1 routes (override the default route cleanly)
if (env("REDIRECT_GATEWAY_METHOD")) {
	var REDIRECT_GATEWAY_METHOD = env("REDIRECT_GATEWAY_METHOD");
} else {
	var REDIRECT_GATEWAY_METHOD = 0;
}

// --------------------------------------------------------------
// Utilities
// --------------------------------------------------------------
function echo(msg)
{
	// TODO: prepend UTC? timestamp to every message
	if (env("LOG2FILE")) {
		log.WriteLine(msg);
	} else {
		WScript.echo(msg);
	}
}

function echoMultiLine(msg)
{
	if (env("LOG2FILE")) {
		log.Write(msg);
	} else {
		WScript.echo(msg);
	}
}

function exec(cmd)
{
	var mirror = true;
	if (typeof arguments[1] != "undefined") mirror = arguments[1];

	echo("<<-- [EXEC] " + cmd);
	var oExec = ws.Exec("%ComSpec% /S /C \"" + cmd + "\"");
	oExec.StdIn.Close();

	var s = oExec.StdOut.ReadAll().trim();
	if (s.length) s += "\n";
	var result = oExec.StdErr.ReadAll().trim();
	if (result.length) {
		result += "\n";
		echoMultiLine("[STDERR] " + result);
	}
	result += s;

	if (mirror || vDebug) echoMultiLine(s);

	var status = oExec.Status;
	var exitCode = oExec.ExitCode;
	echo("-->> (exitCode: " + exitCode + ")");
	accumulatedExitCode += exitCode;

	return result;
}

function getDefaultGateway()
{
	if (exec("route print", vDebug).match(/0\.0\.0\.0 *(0|128)\.0\.0\.0 *([0-9\.]*)/)) {
		return (RegExp.$2);
	}
	return ("");
}

function waitForInterface() {
	var if_route = new RegExp(env("INTERNAL_IP4_ADDRESS") + " *255.255.255.255");
	for (var i = 0; i < 5; i++) {
		if (exec("route print", vDebug).match(if_route)) {
			return true;
		}
		echo("Waiting for interface to come up...");
		WScript.Sleep(2000);
	}
	return false;
}

function routeAdd(dest, gw) {
	var metric = "";
	if (typeof arguments[2] != "undefined") metric = " metric=" + arguments[2];
	exec("netsh interface ipv4 add route " + dest + " interface=" + gw + " store=active" + metric)
}

function trick(trickName) {
	var re = new RegExp("\\b" + trickName + "(?::(\\S+))?\\b");
	var trick = OPENCONNECT_TRICKS.match(re);

	return trick;
}

// --------------------------------------------------------------
// Script starts here
// --------------------------------------------------------------
switch (env("reason")) {
case "pre-init":
	break;
case "connect":
	var gw = getDefaultGateway();
	var address_array = env("INTERNAL_IP4_ADDRESS").split(".");
	var netmask_array = env("INTERNAL_IP4_NETMASK").split(".");
	// Calculate the first usable address in subnet
	var internal_gw_array = new Array(
		address_array[0] & netmask_array[0],
		address_array[1] & netmask_array[1],
		address_array[2] & netmask_array[2],
		(address_array[3] & netmask_array[3]) + 1
	);
	var internal_gw = internal_gw_array.join(".");

	echo("Default Gateway: " + gw)
	echo("VPN Gateway: " + env("VPNGATEWAY"));
	echo("Internal Address: " + env("INTERNAL_IP4_ADDRESS"));
	echo("Internal Netmask: " + env("INTERNAL_IP4_NETMASK"));
	echo("Internal Gateway: " + internal_gw);
	echo("Interface idx: " + env("TUNIDX") + " (\"" + env("TUNDEV") + "\")");

	// Add direct route for the VPN gateway to avoid routing loops
	if (gw.length) {
		exec("route add " + env("VPNGATEWAY") + "/32 " + gw);
	}

	if (env("INTERNAL_IP4_MTU")) {
		echo("MTU: " + env("INTERNAL_IP4_MTU"));
		exec("netsh interface ipv4 set subinterface " + env("TUNIDX") + " mtu=" + env("INTERNAL_IP4_MTU") + " store=active");
		if (env("INTERNAL_IP6_ADDRESS")) {
			exec("netsh interface ipv6 set subinterface " + env("TUNIDX") + " mtu=" + env("INTERNAL_IP4_MTU") + " store=active");
		}
	}

	echo("Configuring " + env("TUNIDX") + " interface for Legacy IP...");

	if (!env("CISCO_SPLIT_INC") && REDIRECT_GATEWAY_METHOD != 2) {
		// Interface metric must be set to 1 in order to add a route with metric 1 since Windows Vista
		exec("netsh interface ipv4 set interface " + env("TUNIDX") + " metric=1");
	}

	echo("Setting network address...");
	if (env("CISCO_SPLIT_INC") || REDIRECT_GATEWAY_METHOD != 0) {
		exec("netsh interface ipv4 set address " + env("TUNIDX") + " static " + env("INTERNAL_IP4_ADDRESS") + " " + env("INTERNAL_IP4_NETMASK"));
	} else {
		// The default route will be added automatically
		exec("netsh interface ipv4 set address " + env("TUNIDX") + " static " + env("INTERNAL_IP4_ADDRESS") + " " + env("INTERNAL_IP4_NETMASK") + " " + internal_gw + " 1");
	}

	// Add internal network routes
	echo("Setting up network routing...");
	if (env("CISCO_SPLIT_INC")) {
		// Waiting for the interface to be configured before to add routes
		if (!waitForInterface()) {
			echo("Interface does not seem to be up.");
		}

		for (var i = 0 ; i < parseInt(env("CISCO_SPLIT_INC")); i++) {
			var network = env("CISCO_SPLIT_INC_" + i + "_ADDR");
			var netmask = env("CISCO_SPLIT_INC_" + i + "_MASK");
			var netmasklen = env("CISCO_SPLIT_INC_" + i + "_MASKLEN");
			// FIX:tricks:noblind Prevent blind private networks rerouting
			if (
				trick("noblind") && (
					network == '10.0.0.0' && netmask == '255.0.0.0'
					|| network == '172.16.0.0' && netmask == '255.240.0.0'
					|| network == '192.168.0.0' && netmask == '255.255.0.0'
				)
			) {
				echo("Skipped rerouting of a whole private address block " + network + "/" + netmasklen);
				continue;
			}
			exec("netsh interface ipv4 add route " + network + "/" + netmasklen + " " + env("TUNIDX"));
		}
	} else if (REDIRECT_GATEWAY_METHOD > 0) {
		// Waiting for the interface to be configured before to add routes
		if (!waitForInterface()) {
			echo("Interface does not seem to be up.");
		}

		if (REDIRECT_GATEWAY_METHOD == 1) {
			exec("route add 0.0.0.0 mask 0.0.0.0 " + internal_gw + " metric 1");
		} else {
			exec("route add 0.0.0.0 mask 128.0.0.0 " + internal_gw);
			exec("route add 128.0.0.0 mask 128.0.0.0 " + internal_gw);
		}
	}

	// FIX:tricks:routes Additional routing rules to sort out the blind routing
	if(trick("routes")) {
		echo("Setting up routing additions...");
		var routes = trick("routes")[1].split(/:/);
		for (var i = 0; i < routes.length; i++) {
			routeAdd(routes[i], env("TUNIDX"));
		}
	}

	echo("Routing configuration done.");

	if (env("INTERNAL_IP4_NBNS")) {
		echo("Setting WINS server(s) address(es)...");
		var wins = env("INTERNAL_IP4_NBNS").split(/ /);
		for (var i = 0; i < wins.length; i++) {
			exec("netsh interface ipv4 add wins " + env("TUNIDX") + " " + wins[i] + " index=" + (i+1));
		}
	}

	if (env("INTERNAL_IP4_DNS")) {
		echo("Setting DNS server(s) address(es)...");
		var dns = env("INTERNAL_IP4_DNS").split(/ /);
		for (var i = 0; i < dns.length; i++) {
			exec("netsh interface ipv4 add dns " + env("TUNIDX") + " " + dns[i] + " validate=no index=" + (i+1));
		}
	}

	// FIX:tricks:dns DNS server override
	var tricks = trick("dns");
	if(tricks && tricks[1].length) {
		echo("Overriding tunnel DNS servers...");
		exec("netsh interface ipv4 set dnsserver " + env("TUNIDX") + " static " + tricks[1]);
	}

	echo("Name resolution settings done...");

	if (env("INTERNAL_IP6_ADDRESS")) {
		echo("Configuring " + env("TUNIDX") + " interface for IPv6...");
		exec("netsh interface ipv6 set address " + env("TUNIDX") + " " + env("INTERNAL_IP6_ADDRESS") + " store=active");
		echo("done.");

		// Add internal network routes
		echo("Configuring IPv6 networks:");
		if (env("INTERNAL_IP6_NETMASK") && !env("INTERNAL_IP6_NETMASK").match("/128$")) {
			exec("netsh interface ipv6 add route " + env("INTERNAL_IP6_NETMASK") + " " + env("TUNIDX") + " fe80::8 store=active");
		}

		if (env("CISCO_IPV6_SPLIT_INC")) {
			for (var i = 0 ; i < parseInt(env("CISCO_IPV6_SPLIT_INC")); i++) {
				var network = env("CISCO_IPV6_SPLIT_INC_" + i + "_ADDR");
				var netmasklen = env("CISCO_SPLIT_INC_" + i + "_MASKLEN");
				exec("netsh interface ipv6 add route " + network + "/" + netmasklen + " " + env("TUNIDX") + " fe80::8 store=active");
			}
		} else {
			echo("Setting default IPv6 route through VPN.");
			exec("netsh interface ipv6 add route 2000::/3 " + env("TUNIDX") + " fe80::8 store=active");
		}
		echo("IPv6 route configuration done.");
	}

	echo("done.");

	if (env("CISCO_BANNER")) {
		echo("--------------------- BANNER ---------------------");
		echo(env("CISCO_BANNER"));
		echo("------------------- BANNER end -------------------");
	}

	// FIX:tricks:openvpn Spawn OpenVPN connection
	if (trick("openvpn") && trick("openvpn")[1].length) {
		echo("[workaround] Telling OpenVPN it can connect now...")
		exec("\"C:/Program Files/OpenVPN/bin/openvpn-gui.exe\" --command connect " + trick("openvpn")[1]);
	}

	break;
case "disconnect":
	var gw = getDefaultGateway();

	echo("Default Gateway: " + gw)
	echo("Interface idx: " + env("TUNIDX") + " (\"" + env("TUNDEV") + "\")");

	// Delete direct route for the VPN gateway
	echo("Deleting Direct Route for VPN Gateway");
	exec("route delete " + env("VPNGATEWAY") + " mask 255.255.255.255");

	// Restore direct route
	echo("Restoring Direct Route");
	//exec("route delete 0.0.0.0 mask 0.0.0.0 ");
	//exec("route add 0.0.0.0 mask 0.0.0.0 " + gw);

	// ReSet Tunnel Adapter IP = nothing
	echo("Resetting Tunnel Adapter IP");
	exec("netsh interface ipv4 set address " + env("TUNIDX") + " source=static 1.0.0.0 255.255.255.255");
	exec("netsh interface ipv4 delete address " + env("TUNIDX") + " 1.0.0.0");

	// Take Down IPv4 Split Tunnel Server-side Network Routes
	if (env("CISCO_SPLIT_INC")) {
		echo(">Removing IPv4 Split Tunnel INC Server-side Network Routes:");
		for (var i = 0 ; i < parseInt(env("CISCO_SPLIT_INC")); i++) {
			var network = env("CISCO_SPLIT_INC_" + i + "_ADDR");
			var netmask = env("CISCO_SPLIT_INC_" + i + "_MASK");
			var netmasklen = env("CISCO_SPLIT_INC_" + i + "_MASKLEN");
			// FIX:tricks:noblind Prevent blind private networks rerouting
			if (
				trick("noblind") && (
					network == '10.0.0.0' && netmask == '255.0.0.0'
					|| network == '172.16.0.0' && netmask == '255.240.0.0'
					|| network == '192.168.0.0' && netmask == '255.255.0.0'
				)
			) {
				continue;
			}
			exec("route delete " + network);
		}
	}

	// Take Down IPv4 Split Tunnel Client-side Network Routes
	if (env("CISCO_SPLIT_LCL")) {
		echo("Removing IPv4 Split Tunnel Local Client-side Network Routes:");
		for (var i = 0 ; i < parseInt(env("CISCO_SPLIT_LCL")); i++) {
			var network = env("CISCO_SPLIT_LCL_" + i + "_ADDR");
			var netmask = env("CISCO_SPLIT_LCL_" + i + "_MASK");
			exec("route delete " + network);
		}
	}

	// FIX:tricks:routes Additional routing rules cleanup
	if(trick("routes")) {
		echo("Cleaning up routing additions...");
		var routes = trick("routes")[1].split(/:/);
		for (var i = 0; i < routes.length; i++) {
			exec("route delete " + routes[i]);
		}
	}

	break;
}

if (env("LOG2FILE")) {
	log.Close();
}

WScript.Quit(accumulatedExitCode);
