---
title: Managing a MikroTik Router from the Terminal
seoTitle: 'Managing MikroTik RouterOS via the Terminal (CLI)'
description: 'Learn how to configure and manage your MikroTik router through the CLI/terminal...'
pubDate: 2026-09-26T14:21:37.902Z
category: Linux
tags: [mikrotik, routeros, cli, networking, terminal, sysadmin]
author: LinuxDev Team
draft: false
featured: true
level: Beginner
duration: '15 min'
heroImage: '/images/mikrotik-ruter-ot-terminala.webp'
heroImageAlt: 'MikroTik Terminal CLI Interface'
lang: en
---

Graphical tools such as WinBox and WebFig are highly convenient, but the real power and flexibility of **MikroTik RouterOS** become apparent once you move to the command-line interface (CLI). In professional network administration, the terminal offers greater efficiency, automation capabilities, and fast troubleshooting during critical incidents.

This guide covers the logic behind the RouterOS terminal, its core syntax, essential network configuration, and the critical commands for backups, upgrades, and ongoing router maintenance.

---

## 1. RouterOS CLI Fundamentals

The command hierarchy in RouterOS resembles a file-system structure. Commands are organized into menus and submenus that correspond to the main functions of the network device.

### Navigation and Keyboard Shortcuts

* **Enter a menu:** Type its name, for example `ip address` or `interface ethernet`.
* **Move up one level:** Use `..`; use `/` to return directly to the root menu.
* **Tab completion:** Press `Tab` to complete a command or display the available options. Pressing it twice lists all valid options in the current menu.
* **Context-sensitive help (?):** Press `?` at any point to display descriptions of the available commands.

### Standard CRUD Operations

Most menus use the following core commands:

1. `print` — Displays the current configuration entries and their index numbers.
2. `add` — Creates a new entry or rule.
3. `set` — Modifies an existing entry, either by index or name.
4. `remove` — Deletes an entry.
5. `enable` / `disable` — Activates or deactivates a selected resource.

---

## 2. Secure Access and Initial Hardening

The first step when working with a new router is to ensure secure access over an encrypted channel.

### Connecting via SSH

```bash
ssh admin@192.168.88.1
```

### Changing Passwords and Managing Users

```routeros
# Change the password for the current administrator account
/user set admin password="MyVeryStrongSuperPa55word!"

# Create a new user with limited privileges
/user add name="operator" group="read" password="OperatorPassword123"
```

> **Security tip:** The `admin` account is a common target for automated attacks precisely because its username is known in advance. Consider creating a new user with `full` privileges and a unique name, then disabling—or even removing—the default `admin` account rather than simply changing its password.

### Disabling Unnecessary Services

```routeros
/ip service
set telnet disabled=yes
set ftp disabled=yes
set www disabled=yes
set api disabled=yes
set api-ssl disabled=yes
```

Keep only the management services you actually use enabled—typically `ssh` and, if needed, `winbox`.

---

## 3. Advanced Network Configuration

Network setup involves interfaces, IP addresses, bridges, DNS, and routing.

### 3.1. Managing Interfaces and Bridges

```routeros
# List all physical and virtual interfaces
/interface print

# Rename interfaces for clearer identification
/interface set ether1 name="ether1-WAN"
/interface set ether2 name="ether2-LAN"

# Create a bridge (software switch) and add ports to it
/interface bridge add name=bridge-local
/interface bridge port add bridge=bridge-local interface=ether2-LAN
/interface bridge port add bridge=bridge-local interface=ether3
```

### 3.2. IP Addresses and Static Routes

```routeros
# Assign an IP address to the bridge interface
/ip address add address=192.168.10.1/24 interface=bridge-local comment="LAN Gateway"

# Assign a static WAN IP address (example address from the RFC 5737 documentation range)
/ip address add address=203.0.113.10/24 interface=ether1-WAN comment="WAN IP"

# Set the default gateway (default route)
/ip route add gateway=203.0.113.1 comment="Default Internet Route"
```

### 3.3. DNS and DHCP Server

```routeros
# Configure a DNS resolver with caching
/ip dns set servers=1.1.1.1,8.8.8.8 allow-remote-requests=yes

# Configure the DHCP pool and server
/ip pool add name=dhcp_pool_lan ranges=192.168.10.100-192.168.10.200

/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1

/ip dhcp-server add name=LAN_DHCP interface=bridge-local address-pool=dhcp_pool_lan disabled=no
```

---

## 4. Firewall and NAT

### Enabling NAT (Masquerade)

```routeros
/ip firewall nat
add chain=srcnat out-interface=ether1-WAN action=masquerade comment="Default Masquerade"
```

### A Complete, Secure Set of Filter Rules

Rule order is critical: RouterOS evaluates rules sequentially and stops at the first match. The ruleset below includes explicit **catch-all drop** rules for both the `input` and `forward` chains. Without them, unmatched packets pass through by default (`policy=accept`).

```routeros
/ip firewall filter

# --- INPUT chain (traffic destined for the router itself) ---
add chain=input connection-state=established,related action=accept comment="Accept established, related"
add chain=input connection-state=invalid action=drop comment="Drop invalid"
add chain=input protocol=icmp action=accept comment="Allow Ping"
add chain=input in-interface=bridge-local action=accept comment="Allow Management from LAN"
add chain=input action=drop comment="Drop everything else - input"

# --- FORWARD chain (traffic passing through the router, LAN <-> WAN) ---
add chain=forward connection-state=established,related action=accept comment="Accept established, related"
add chain=forward connection-state=invalid action=drop comment="Drop invalid"
add chain=forward connection-state=new in-interface=ether1-WAN action=drop comment="Block new connections initiated from WAN"
add chain=forward in-interface=bridge-local action=accept comment="Allow LAN to WAN"
add chain=forward action=drop comment="Drop everything else - forward"
```

> **A more scalable approach (RouterOS v7):** Instead of hard-coding `ether1-WAN` throughout the configuration, use `/interface list`—for example, create a `WAN` list and a `LAN` list, then reference `interface-list=WAN` in your firewall rules. This way, changing the WAN interface does not require modifying the firewall rules.

### 4.1. IPv6 Firewall — Do Not Skip It

This is a common and dangerous gap in self-configured routers. RouterOS has **IPv6 enabled by default**, while IPv4 and IPv6 use **completely separate** firewall tables (`/ip firewall` and `/ipv6 firewall`). If your ISP provides IPv6—either natively or through SLAAC/PD from upstream—your LAN hosts receive **global unicast IPv6 addresses and generally do not pass through NAT**. In other words, they can be directly reachable from the internet, and the IPv4 rules in Section 4 do **not** protect them.

There is also an important difference from ICMP in IPv4: **ICMPv6 must not be blocked entirely**. It carries Neighbor Discovery (NDP), Router Advertisement, and Path MTU Discovery—functions without which IPv6 simply will not work. Therefore, allowing ICMPv6 here is not optional; it is a requirement.

```routeros
/ipv6 firewall filter

# --- INPUT chain ---
add chain=input connection-state=established,related action=accept comment="Accept established, related"
add chain=input connection-state=invalid action=drop comment="Drop invalid"
add chain=input protocol=icmpv6 action=accept comment="Allow ICMPv6 - required for NDP/RA/PMTU"
add chain=input in-interface=bridge-local action=accept comment="Allow Management from LAN"
add chain=input action=drop comment="Drop everything else - input"

# --- FORWARD chain ---
add chain=forward connection-state=established,related action=accept comment="Accept established, related"
add chain=forward connection-state=invalid action=drop comment="Drop invalid"
add chain=forward protocol=icmpv6 action=accept comment="Allow ICMPv6 through"
add chain=forward connection-state=new in-interface=ether1-WAN action=drop comment="Block new connections initiated from WAN"
add chain=forward in-interface=bridge-local action=accept comment="Allow LAN to WAN"
add chain=forward action=drop comment="Drop everything else - forward"
```

If you do not use IPv6 at all, the simpler and safer option is to disable the package rather than maintain a second firewall:

```routeros
/system package disable ipv6
/system reboot
```

---

## 5. Backup and Restore Commands

RouterOS provides two primary methods for preserving your configuration: a **binary backup (`.backup`)** and a **text export (`.rsc`)**.

### 5.1. Binary Backup (`/system backup`)

A binary backup preserves the complete configuration, including users, passwords, cryptographic keys, and settings. It is **hardware-specific**: it is tied to the license information and serial number of the particular RouterBOARD. Restoring it on a different physical router may therefore cause conflicts or fail entirely. For this reason, `.backup` files are suitable only for restoring the **same** device; use a text export for migration between routers.

**Important correction:** `/system backup save` automatically appends the `.backup` extension to the file name. If you specify `name=full_backup_2026.backup`, the file is actually saved as `full_backup_2026.backup.backup`, and a subsequent `load` command using `name=full_backup_2026.backup` will not find it. Do not include the extension in the `name=` parameter:

```routeros
# Create an encrypted binary backup — WITHOUT the extension in the name
/system backup save name=full-backup-2026 password="SecureBackupPassword123"

# List available files. Searching by name is safer than relying on the exact
# value in the "type" column, which can vary slightly between RouterOS versions.
/file print where name~".backup"

# Restore a backup. Here the name DOES include the extension because you are
# referring to an existing file.
/system backup load name=full-backup-2026.backup password="SecureBackupPassword123"
```

Two behaviors that do not trigger a default warning:

- `/system backup load` **completely overwrites** the current configuration and reboots the device. In an interactive terminal, it asks for confirmation (`y`); in a script, execution may stall unless confirmation is supplied in advance.
- A backup stores *references* to installed packages, but not the packages themselves. If you restore onto a clean RouterOS installation, a missing package—for example, wireless on a device that does not include it—means the related settings will silently fail to work, without an explicit error during the restore.

### 5.2. Text Export (`/export`)

The export command generates a human-readable CLI script file (`.rsc`). It is suitable for transferring a configuration to another device or storing it in Git.

```routeros
# Export the entire configuration to a file
/export file=router_config

# Export only a specific section, such as the firewall
/ip firewall export file=firewall_rules

# Export while hiding sensitive data such as passwords and keys
/export hide-sensitive file=clean_config

# Restore/import a script file
/import file-name=clean_config.rsc
```

Two differences from `.backup` are worth knowing before relying on `.rsc` as a restore method:

- `hide-sensitive` does **not** store real passwords; it replaces them with placeholders. Importing such an export will not restore user passwords—you must set them again manually.
- Unlike `/system backup load`, `/import` does **not** clear the existing configuration. It simply executes the commands in the script against the current state. For a clean restore from an `.rsc` file, first run `/system reset-configuration no-defaults=yes skip-backup=yes`, and only then run `/import`.

### 5.3. Automated Backups with Scheduler

One of the main advantages of the CLI is automation. The following minimal example creates a daily backup at 03:00:

```routeros
/system scheduler add name="Daily-Backup" start-time=03:00:00 interval=1d \
  on-event="/system backup save name=daily-backup password=SecureBackupPassword123"
```

The file remains stored locally on the device. For genuine protection against hardware failure, combine this with `/tool fetch` or a script that transfers the backup to a remote FTP/SFTP server.

---

## 6. Upgrade and Maintenance Commands

Keeping RouterOS up to date is essential for both security and network stability.

> **Before a major upgrade**—for example, v6 to v7—always create a fresh `.backup` file and `.rsc` export. Also make sure you have physical or console access to the device; do not rely solely on a remote connection if something goes wrong.

### 6.1. Upgrading RouterOS

```routeros
# Check for a newer version (Channel: stable, testing, long-term)
/system package update set channel=stable
/system package update check-for-updates

# Download and install automatically (the router will reboot)
/system package update install
```

### 6.2. Upgrading RouterBOARD Firmware

When upgrading RouterOS, it is also important to update the RouterBOARD BIOS/firmware:

```routeros
# Check the current and available firmware versions
/system routerboard print

# Upgrade the firmware if Current Firmware differs from Upgrade Firmware
/system routerboard upgrade

# Reboot to apply the new firmware
/system reboot
```

### 6.3. System Maintenance and Management Commands

```routeros
# View system resources (CPU, memory, uptime)
/system resource print

# Reboot the router
/system reboot

# Shut down safely
/system shutdown

# Reset to factory settings without creating a backup
/system reset-configuration no-defaults=yes skip-backup=yes
```

---

## 7. Real-Time Monitoring and Diagnostics

```routeros
# Test connectivity
/ping 1.1.1.1 count=5

# Monitor traffic through a specific interface in real time
/tool torch interface=bridge-local

# Monitor interface load
/interface monitor-traffic interface=ether1-WAN

# View live log messages
/log print follow
```

---

## Conclusion

Mastering MikroTik RouterOS through the CLI gives you full control over your network infrastructure. By using network commands effectively, maintaining an explicit and complete firewall ruleset, creating regular `.rsc` and `.backup` files—ideally automated through the scheduler—and keeping RouterOS and RouterBOARD firmware up to date, you ensure a secure and reliable system.
