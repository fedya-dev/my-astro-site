---
title: Mikrotik рутер от терминала
seoTitle: 'Управление на MikroTik RouterOS през терминал (CLI)'
description: 'Научете как да конфигурирате и управлявате Вашия MikroTik рутер през CLI/терминал. Практическо ръководство с команди за мрежова настройка, firewall, бекъп, обновяване и поддръжка.'
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
---

Графичните интерфейси като WinBox и WebFig са изключително удобни, но истинската сила и гъвкавост на **MikroTik RouterOS** се разкриват тогава, когато преминете към командния ред (CLI). В професионалната мрежова администрация използването на терминала осигурява висока ефективност, възможности за автоматизация и бърза диагностика при критични ситуации.

В тази статия ще разгледаме логиката на терминала в RouterOS, основните синтактични правила, мрежовите конфигурации, както и жизненоважните команди за архивиране (backup), обновяване и поддръжка на рутера.

---

## 1. Основни концепции на RouterOS CLI

Йерархията на командите в RouterOS напомня за структурата на файлова система. Командите са групирани в менюта и подменюта, които отговарят на основните функционалности на мрежовото оборудване.

### Навигация и бързи бутони

* **Преминаване в меню:** Напишете името му, например `ip address` или `interface ethernet`.
* **Връщане назад:** Командата `..` ви връща едно ниво нагоре, а `/` ви препраща директно в коренното меню.
* **Автодовършване (Tab):** Бутонът `Tab` допълва командата или показва наличните възможности. Натиснат два пъти, той извежда всички достъпни опции в текущото меню.
* **Контекстна помощ (?):** Натискането на `?` по всяко време показва описание на наличните команди.

### Стандартни операции (CRUD)

В почти всяко меню се използват следните основни команди:
1. `print` – Извежда списък с текущите конфигурации и техните индекси (номера).
2. `add` – Добавя нов запис или правило.
3. `set` – Променя параметрите на съществуващ запис (по индекс или име).
4. `remove` – Изтрива запис.
5. `enable` / `disable` – Активира или деактивира избран ресурс.

---

## 2. Безопасно свързване и начална сигурност

Първата стъпка при работа с нов рутер е осигуряването на безопасен достъп през кодиран канал.

### Свързване през SSH
```bash
ssh admin@192.168.88.1
```

### Смяна на парола и управление на потребители
```routeros
# Смяна на паролата на текущия администратор
/user set admin password="MoyataMognoSuperPa55word!"

# Създаване на нов потребител с ограничени права
/user add name="operator" group="read" password="OperatorPassword123"
```

> **Съвет за сигурност:** акаунтът `admin` е стандартна цел за автоматизирани атаки именно защото името му е известно предварително. Обмислете създаването на нов `full`-права потребител с уникално име и **disable** (или дори `remove`) на `admin`, вместо просто да му смените паролата.

### Деактивиране на ненужни услуги
```routeros
/ip service
set telnet disabled=yes
set ftp disabled=yes
set www disabled=yes
set api disabled=yes
set api-ssl disabled=yes
```

Оставете активни само услугите, които реално използвате за управление (обичайно `ssh` и евентуално `winbox`).

---

## 3. Разширени команди за мрежова конфигурация

Мрежовата настройка обхваща интерфейсите, IP адресите, мостовете (Bridge), DNS и рутирането.

### 3.1. Управление на интерфейси и Bridge
```routeros
# Преглед на всички физически и виртуални интерфейси
/interface print

# Преименуване на интерфейс за по-добра прегледност
/interface set ether1 name="ether1-WAN"
/interface set ether2 name="ether2-LAN"

# Създаване на Bridge (софтуерен суич) и добавяне на портове към него
/interface bridge add name=bridge-local
/interface bridge port add bridge=bridge-local interface=ether2-LAN
/interface bridge port add bridge=bridge-local interface=ether3
```

### 3.2. IP адреси и Static Routes
```routeros
# Задаване на IP адрес на Bridge интерфейса
/ip address add address=192.168.10.1/24 interface=bridge-local comment="LAN Gateway"

# Задаване на статичен WAN IP адрес (примерен адрес от документационния диапазон RFC 5737)
/ip address add address=203.0.113.10/24 interface=ether1-WAN comment="WAN IP"

# Задаване на Gateway по подразбиране (Default Route)
/ip route add gateway=203.0.113.1 comment="Default Internet Route"
```

### 3.3. DNS и DHCP Сървър
```routeros
# Настройка на DNS резолвер с кеширане
/ip dns set servers=1.1.1.1,8.8.8.8 allow-remote-requests=yes

# Настройка на DHCP пул и сървър
/ip pool add name=dhcp_pool_lan ranges=192.168.10.100-192.168.10.200

/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1

/ip dhcp-server add name=LAN_DHCP interface=bridge-local address-pool=dhcp_pool_lan disabled=no
```

---

## 4. Защитна стена (Firewall) и NAT

### Включване на NAT (Masquerade)
```routeros
/ip firewall nat
add chain=srcnat out-interface=ether1-WAN action=masquerade comment="Default Masquerade"
```

### Пълен, безопасен набор от filter rules

Редът на правилата е критичен — RouterOS ги обхожда последователно и спира на първото съвпадение. Наборът по-долу включва изричен **catch-all drop** и за `input`, и за `forward` chain — без него по подразбиране (`policy=accept`) всеки нематчнат пакет минава.

```routeros
/ip firewall filter

# --- INPUT chain (трафик КЪМ самия рутер) ---
add chain=input connection-state=established,related action=accept comment="Accept established, related"
add chain=input connection-state=invalid action=drop comment="Drop invalid"
add chain=input protocol=icmp action=accept comment="Allow Ping"
add chain=input in-interface=bridge-local action=accept comment="Allow Management from LAN"
add chain=input action=drop comment="Drop everything else - input"

# --- FORWARD chain (трафик ПРЕЗ рутера, LAN <-> WAN) ---
add chain=forward connection-state=established,related action=accept comment="Accept established, related"
add chain=forward connection-state=invalid action=drop comment="Drop invalid"
add chain=forward connection-state=new in-interface=ether1-WAN action=drop comment="Block new connections initiated from WAN"
add chain=forward in-interface=bridge-local action=accept comment="Allow LAN to WAN"
add chain=forward action=drop comment="Drop everything else - forward"
```

> **По-мащабируем подход (RouterOS v7):** вместо да хардкодвате `ether1-WAN` навсякъде, използвайте `/interface list` — например `add name=WAN` и `add name=LAN`, след което правилата реферират `interface-list=WAN` вместо конкретно име. Така при смяна на WAN интерфейса не се налага да пипате firewall правилата.

### 4.1. IPv6 Firewall — не го пропускайте

Това е честа и опасна дупка в самостоятелно конфигурирани рутери: RouterOS има **активиран IPv6 по подразбиране**, а IPv4 и IPv6 имат **напълно отделни** firewall таблици (`/ip firewall` и `/ipv6 firewall`). Ако ISP-то ви дава IPv6 (native или чрез SLAAC/PD от upstream), LAN хостовете ви получават **глобални (GUA) IPv6 адреси и обикновено не минават през NAT** — т.е. са директно достижими от интернет. Правилата по-горе в раздел 4 **не** ги пазят.

Важна разлика спрямо ICMP в IPv4: **ICMPv6 не бива да се блокира тотално** — той носи Neighbor Discovery (NDP), Router Advertisement и Path MTU Discovery, без които IPv6 просто не работи. Затова тук `accept` за ICMPv6 не е опция, а изискване.

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

Ако не използвате IPv6 изобщо, по-простото и по-сигурно решение е да изключите package-а, вместо да поддържате втори firewall:
```routeros
/system package disable ipv6
/system reboot
```

---

## 5. Команди за бекъп и възстановяване (Backup & Restore)

В RouterOS съществуват два основни начина за съхранение на конфигурацията: **Двоичен бекъп (.backup)** и **Текстов експорт (.rsc)**.

### 5.1. Двоичен бекъп (`/system backup`)
Двоичният бекъп запазва пълната конфигурация — потребители, пароли, криптографски ключове и настройки. Той е **hardware-specific**: обвързан е с лицензната информация и серийния номер на конкретния RouterBOARD, затова възстановяването му на различен физически рутер може да доведе до конфликт или отказ. Затова `.backup` е подходящ само за възстановяване на **същото** устройство, а не за миграция между рутери — за това служи текстовият export.

**Важна корекция:** `/system backup save` **сам добавя** разширението `.backup` към името на файла. Ако подадете `name=full_backup_2026.backup`, файлът реално се записва като `full_backup_2026.backup.backup` — и последващата команда `load` с `name=full_backup_2026.backup` няма да намери файла. Не включвайте разширението в `name=`:

```routeros
# Създаване на двоичен бекуап (криптиран с парола) — БЕЗ разширение в името
/system backup save name=full-backup-2026 password="SecureBackupPassword123"

# Преглед на наличните файлове — по-сигурно е да търсите по име, отколкото да разчитате
# на точния низ в колоната "type" (варира леко между RouterOS версии)
/file print where name~".backup"

# Възстановяване на бекуап — тук ИМЕТО ВКЛЮЧВА разширението, защото реферирате готов файл
/system backup load name=full-backup-2026.backup password="SecureBackupPassword123"
```

Две неща, за които няма предупреждение по подразбиране:
- `/system backup load` **презаписва изцяло** текущата конфигурация и рестартира устройството — в интерактивен терминал ще поиска потвърждение (`y`); в скрипт това може да блокира изпълнението, ако не подадете потвърждението предварително.
- Backup-ът пази *референции* към инсталирани пакети, но не самите пакети. Ако възстановявате на "чист" RouterOS install, липсващ пакет (напр. wireless на устройство без него) означава, че свързаните настройки просто няма да проработят, без изрична грешка при самия restore.

### 5.2. Текстов експорт (`/export`)
Експортът генерира четим CLI script файл (`.rsc`). Подходящ е за пренасяне на конфигурация към друго устройство или за съхранение в Git.

```routeros
# Експортиране на цялата конфигурация във файл
/export file=router_config

# Експортиране само на конкретна секция (напр. Firewall)
/ip firewall export file=firewall_rules

# Експортиране с скриване на чувствителни данни (пароли, ключове)
/export hide-sensitive file=clean_config

# Възстановяване/Импортиране на скрипт файл
/import file-name=clean_config.rsc
```

Две разлики спрямо `.backup`, които си струва да знаете, преди да разчитате на `.rsc` като restore метод:
- `hide-sensitive` **не записва** истинските пароли (заменя ги с placeholder) — импортирането на такъв export не възстановява паролите на потребителите; тях ги задавате наново ръчно.
- За разлика от `/system backup load`, `/import` **не изчиства** текущата конфигурация — той просто изпълнява командите в скрипта върху съществуващото състояние. За "чист" restore от `.rsc` първо направете `/system reset-configuration no-defaults=yes skip-backup=yes`, и едва тогава `/import`.

### 5.3. Автоматизиран бекъп със Scheduler

Истинската полза от CLI е автоматизацията. Ето минимален пример за ежедневен бекъп в 03:00 ч.:

```routeros
/system scheduler add name="Daily-Backup" start-time=03:00:00 interval=1d \
  on-event="/system backup save name=daily-backup password=SecureBackupPassword123"
```

Файлът остава локално на устройството — за реална защита при отказ на хардуера, комбинирайте това с `/tool fetch` или скрипт, който изпраща бекъпа към отдалечен FTP/SFTP сървър.

---

## 6. Команди за обновяване и поддръжка

Поддържането на RouterOS актуален е от ключово значение за сигурността и стабилността на вашата мрежа.

> **Преди мажорно ъпгрейдване** (напр. v6 → v7) винаги направете пресен `.backup` и `.rsc` export, и уверете се, че имате физически или конзолен достъп до устройството — не разчитайте единствено на отдалечена връзка, ако нещо се обърка.

### 6.1. Обновяване на RouterOS
```routeros
# Проверка за налична нова версия (Channel: stable, testing, long-term)
/system package update set channel=stable
/system package update check-for-updates

# Изтегляне и автоматично инсталиране (рутерът ще се рестартира)
/system package update install
```

### 6.2. Обновяване на хардуерния софтуер (RouterBOARD Firmware)
При обновяване на RouterOS е важно да се актуализира и RouterBOARD BIOS/firmware-ът:

```routeros
# Проверка на текущата и наличната версия на firmware
/system routerboard print

# Обновяване на firmware (ако Current Firmware != Upgrade Firmware)
/system routerboard upgrade

# Рестартиране за прилагане на новия firmware
/system reboot
```

### 6.3. Команди за системна поддръжка и управление
```routeros
# Преглед на системните ресурси (процесор, памет, uptime)
/system resource print

# Рестартиране на рутера
/system reboot

# Безопасно изключване
/system shutdown

# Нулиране до фабрични настройки (без бекуап)
/system reset-configuration no-defaults=yes skip-backup=yes
```

---

## 7. Мониторинг и диагностика в реално време

```routeros
# Тестване на свързаност
/ping 1.1.1.1 count=5

# Мониторинг на трафик през конкретен интерфейс в реално време
/tool torch interface=bridge-local

# Мониторинг на натоварването на интерфейсите
/interface monitor-traffic interface=ether1-WAN

# Преглед на лог съобщенията на живо
/log print follow
```

---

## Заключение

Овладяването на MikroTik RouterOS през CLI терминала ви осигурява пълен контрол върху вашата мрежова инфраструктура. Чрез умелото използване на мрежовите команди, изричен и завършен firewall ruleset, поддържането на редовни архиви (`.rsc` и `.backup`, идеално автоматизирани през scheduler) и своевременното обновяване на RouterOS и RouterBOARD firmware, гарантирате висока сигурност и надеждност на вашата система.