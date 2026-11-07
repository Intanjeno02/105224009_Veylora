# Analisis Inventarisasi Patch Management — Pekan 5

## Ruang Lingkup

Pemeriksaan ini hanya inventarisasi dan analisis pada Ubuntu 26.04 LTS melalui WSL 2. Tidak ada `apt update`, instalasi, upgrade, penghapusan paket, atau perubahan konfigurasi yang dilakukan. Informasi paket berasal dari indeks APT yang telah tersimpan pada saat pemeriksaan; hasil dapat berubah setelah indeks diperbarui.

## Informasi Sistem

| Item | Hasil |
|---|---|
| Distribusi | Ubuntu 26.04 LTS (`resolute`) |
| Kernel | `6.18.33.1-microsoft-standard-WSL2` |
| Lingkungan | Ubuntu melalui WSL 2 |
| Tanggal pemeriksaan | 2026-11-07 14:39:15 +07 |
| Sumber inventaris | `apt list --upgradable`, metadata cache APT yang tersedia |
| Waktu indeks yang terlihat | `resolute-updates`: 2026-11-07 09:36; `resolute-security`: 2026-11-07 03:45 |

Karena indeks tidak diperbarui selama pemeriksaan, jumlah dan versi kandidat ini adalah snapshot cache, bukan jaminan keadaan repository terkini.

## Paket yang Dapat Diperbarui

`apt list --upgradable` mencatat **193 paket**. Nama paket yang terdeteksi:

```text
apparmor, apport-core-dump-handler, apport, apt, at-spi2-common, at-spi2-core, base-files, bsdextrautils, bsdutils, bubblewrap, byobu, ca-certificates, cloud-init-base, cloud-init, console-setup-linux, console-setup, curl, diffutils, dirmngr, distro-info-data,
eject, fdisk, gawk, gir1.2-girepository-3.0, gir1.2-glib-2.0, gir1.2-packagekitglib-1.0, git-man, git, glycin-loaders, glycin-thumbnailers, gnu-coreutils, gnupg-l10n, gnupg-utils, gnupg, gpg-agent, gpg-wks-client, gpg, gpgconf, gpgsm, gpgv,
gtk-update-icon-cache, gzip, iproute2, keyboard-configuration, krb5-locales, libaom3, libapparmor1, libapt-pkg7.0, libatk-bridge2.0-0t64, libatk1.0-0t64, libatspi2.0-0t64, libattr1, libaudit-common, libaudit1, libavahi-client3, libavahi-common-data, libavahi-common3, libblkid1, libbrotli1, libbz2-1.0,
libc-bin, libc-gconv-modules-extra, libc6, libcups2t64, libcurl3t64-gnutls, libcurl4t64, libegl-mesa0, libevent-core-2.1-7t64, libexpat1, libfdisk1, libfreetype6, libgbm1, libgcrypt20, libgirepository-2.0-0, libgl1-mesa-dri, libglib2.0-0t64, libglib2.0-bin, libglib2.0-data, libglx-mesa0, libglycin-2-0,
libgnutls30t64, libgraphite2-3, libgssapi-krb5-2, libheif-plugin-aomdec, libheif-plugin-aomenc, libheif1, libjxl0.11, libk5crypto3, libkrb5-3, libkrb5support0, liblcms2-2, liblzma5, libmount1, libnetplan1, libnghttp2-14, libnss-systemd, libpackagekit-glib2-18, libpam-modules-bin, libpam-modules, libpam-runtime,
libpam-systemd, libpam0g, libpciaccess0, libpcre2-8-0, libperl5.40, libpng16-16t64, libpolkit-agent-1-0, libpolkit-gobject-1-0, libpython3.14-minimal, libpython3.14-stdlib, libpython3.14, librsvg2-2, librsvg2-common, libsmartcols1, libsqlite3-0, libssh2-1t64, libssl3t64, libsystemd-shared, libsystemd0, libudev1,
libuuid1, libx11-6, libx11-data, libx11-xcb1, libxml2-16, libxtst6, locales, login, mesa-libgallium, mesa-vulkan-drivers, motd-news-config, mount, nano, netplan-generator, netplan.io, openssl-provider-legacy, openssl, packagekit, perl-base, perl-modules-5.40,
perl, polkitd, python-apt-common, python3-apport, python3-apt, python3-cryptography, python3-distupgrade, python3-httplib2, python3-idna, python3-jwt, python3-netplan, python3-problem-report, python3-pyasn1, python3-requests, python3-software-properties, python3-twisted, python3-urllib3, python3.14-gdbm, python3.14-minimal, python3.14,
rsync, rsyslog, rust-coreutils, sed, snapd, software-properties-common, sudo-rs, sudo, systemd-cryptsetup, systemd-resolved, systemd-sysv, systemd, tar, tmux, tzdata, ubuntu-insights, ubuntu-minimal, ubuntu-pro-client-l10n, ubuntu-pro-client, ubuntu-release-upgrader-core,
ubuntu-wsl, udev, util-linux, vim-common, vim-runtime, vim-tiny, vim, wget, wsl-pro-service, wsl-setup, xxd, xz-utils, zlib1g
```

### Paket dengan Kandidat dari `resolute-security`

Dari metadata `apt list --upgradable`, **123 paket** memiliki candidate source yang mencantumkan pocket `resolute-security`. Ini menunjukkan tersedia candidate dari pocket keamanan pada cache tersebut; label ini sendiri bukan analisis CVE dan tidak membuktikan setiap paket terpasang rentan.

```text
apt, bsdextrautils, bsdutils, bubblewrap, ca-certificates, curl, diffutils, dirmngr, distro-info-data, eject, fdisk, gawk, gir1.2-girepository-3.0, gir1.2-glib-2.0, git-man, git, gnu-coreutils, gnupg-l10n, gnupg-utils, gnupg,
gpg-agent, gpg-wks-client, gpg, gpgconf, gpgsm, gpgv, gzip, krb5-locales, libaom3, libapt-pkg7.0, libattr1, libavahi-client3, libavahi-common-data, libavahi-common3, libblkid1, libbrotli1, libbz2-1.0, libc-bin, libc-gconv-modules-extra, libc6,
libcups2t64, libcurl3t64-gnutls, libcurl4t64, libevent-core-2.1-7t64, libexpat1, libfdisk1, libfreetype6, libgcrypt20, libgirepository-2.0-0, libglib2.0-0t64, libglib2.0-bin, libglib2.0-data, libgnutls30t64, libgraphite2-3, libgssapi-krb5-2, libheif-plugin-aomdec, libheif-plugin-aomenc, libheif1, libjxl0.11, libk5crypto3,
libkrb5-3, libkrb5support0, liblcms2-2, liblzma5, libmount1, libnghttp2-14, libpam-modules-bin, libpam-modules, libpam-runtime, libpam0g, libpcre2-8-0, libperl5.40, libpng16-16t64, libpolkit-agent-1-0, libpolkit-gobject-1-0, libpython3.14-minimal, libpython3.14-stdlib, libpython3.14, librsvg2-2, librsvg2-common,
libsmartcols1, libsqlite3-0, libssh2-1t64, libssl3t64, libuuid1, libx11-6, libx11-data, libx11-xcb1, libxml2-16, libxtst6, locales, login, mount, nano, openssl-provider-legacy, openssl, perl-base, perl-modules-5.40, perl, polkitd,
python3-cryptography, python3-httplib2, python3-idna, python3-jwt, python3-pyasn1, python3-requests, python3-twisted, python3-urllib3, python3.14-gdbm, python3.14-minimal, python3.14, rsync, rsyslog, sed, sudo-rs, sudo, tar, tzdata, util-linux, wget,
wsl-pro-service, xz-utils, zlib1g
```

## Kondisi OpenSSH

| Paket | Terpasang | Kandidat APT | Status |
|---|---|---|---|
| `openssh-server` | `1:10.2p1-2ubuntu3.8` | `1:10.2p1-2ubuntu3.8` | Tidak ada versi lebih baru yang ditawarkan cache saat pemeriksaan. |
| `openssh-client` | `1:10.2p1-2ubuntu3.8` | `1:10.2p1-2ubuntu3.8` | Tidak ada versi lebih baru yang ditawarkan cache saat pemeriksaan. |

APT menunjukkan kedua paket berada pada candidate dari `resolute-updates` dan `resolute-security`; versi terpasang sudah sama dengan candidate. SSH service dan socket berstatus aktif, listener port 22 tersedia, dan konfigurasi efektif terakhir yang diverifikasi adalah:

```text
port 22
permitrootlogin no
passwordauthentication no
pubkeyauthentication yes
maxauthtries 3
x11forwarding no
allowusers intanlucu
```

Pemeriksaan efektif terkini menggunakan `sudo sshd -T` berhasil dilakukan secara interaktif pada saat inventarisasi. Tidak ada konfigurasi SSH yang diubah.

## Warning Lynis dan Bukti Paket

Audit awal Lynis (2026-11-07) mencatat `Warnings (1)` dengan kontrol `PKGS-7392`: “Found one or more vulnerable packages.” Log `/var/log/lynis.log` mengidentifikasi 124 nama paket sebagai hasil deteksi Lynis:

```text
apt, bsdextrautils, bsdutils, bubblewrap, ca-certificates, curl, diffutils, dirmngr, distro-info-data, eject, fdisk, gawk, gir1.2-girepository-3.0, gir1.2-glib-2.0, git, git-man, gnu-coreutils, gnupg, gnupg-l10n, gnupg-utils, gpg, gpg-agent, gpg-wks-client, gpgconf, gpgsm, gpgv, gzip, krb5-locales, libaom3, libapt-pkg7.0, libattr1, libavahi-client3, libavahi-common-data, libavahi-common3, libblkid1, libbrotli1, libbz2-1.0, libc-bin, libc-gconv-modules-extra, libc6, libcups2t64, libcurl3t64-gnutls, libcurl4t64, libevent-core-2.1-7t64, libexpat1, libfdisk1, libfreetype6, libgcrypt20, libgirepository-2.0-0, libglib2.0-0t64, libglib2.0-bin, libglib2.0-data, libgnutls30t64, libgraphite2-3, libgssapi-krb5-2, libheif-plugin-aomdec, libheif-plugin-aomenc, libheif1, libjxl0.11, libk5crypto3, libkrb5-3, libkrb5support0, liblcms2-2, liblzma5, libmount1, libnghttp2-14, libpam-modules, libpam-modules-bin, libpam-runtime, libpam0g, libpcre2-8-0, libperl5.40, libpng16-16t64, libpolkit-agent-1-0, libpolkit-gobject-1-0, libpython3.14, libpython3.14-minimal, libpython3.14-stdlib, librsvg2-2, librsvg2-common, libsmartcols1, libsqlite3-0, libssh2-1t64, libssl3t64, libuuid1, libx11-6, libx11-data, libx11-xcb1, libxml2-16, libxtst6, locales, login, mount, nano, openssh-client, openssl, openssl-provider-legacy, perl, perl-base, perl-modules-5.40, polkitd, python3-cryptography, python3-httplib2, python3-idna, python3-jwt, python3-pyasn1, python3-requests, python3-twisted, python3-urllib3, python3.14, python3.14-gdbm, python3.14-minimal, rsync, rsyslog, sed, sudo, sudo-rs, tar, tzdata, util-linux, wget, wsl-pro-service, xz-utils, zlib1g
```

Temuan Lynis adalah hasil pemindaian dan tidak menyertakan CVE, versi terdampak, atau detail solusi dalam entry `PKGS-7392`. Karena itu laporan ini tidak menyatakan semua nama di atas sebagai kerentanan yang telah dikonfirmasi secara independen. Sebanyak 123 nama selain `openssh-client` cocok dengan kandidat paket dari pocket keamanan pada cache APT. `openssh-client` muncul pada log Lynis, tetapi versinya saat inventarisasi sama dengan candidate APT; bukti yang tersedia tidak menunjukkan pembaruan OpenSSH tertunda.

## Prioritas Rekomendasi

1. **Prioritas tinggi untuk peninjauan pembaruan keamanan:** tinjau candidate dari `resolute-security` yang juga disebut oleh Lynis, khususnya komponen dasar dan keamanan seperti `sudo`, `openssl`/`libssl3t64`, `libc6`, `apt`, `systemd`-terkait bila tersedia pada pocket tersebut, serta library kriptografi. Cocokkan setiap paket dan versi dengan advisori Ubuntu/CVE sebelum mengklaim dampak tertentu.
2. **Prioritas berikutnya:** tinjau sisa paket dari pocket keamanan, lalu paket dari `resolute-updates` yang bukan security-origin. Periksa dampak dependensi, perubahan layanan, dan kebutuhan restart secara terencana.
3. **OpenSSH:** tidak ada pembaruan kandidat untuk server/client menurut cache saat ini. Pertahankan konfigurasi hardening dan validasi ulang `sshd -t`, `sshd -T`, serta login key setelah pembaruan OpenSSH di masa mendatang.
4. Sebelum tindakan patch management berikutnya, perbarui indeks paket dan ulangi inventarisasi; cache yang digunakan dalam laporan ini terakhir menunjukkan security index pada pukul 03:45. Lakukan pembaruan hanya setelah persetujuan dan siapkan validasi pascapembaruan.

## Perubahan yang Tidak Dilakukan

Pada tahap inventarisasi awal, tidak ada `apt update`, instalasi, upgrade, penghapusan paket, perubahan SSH, atau perubahan database. Bagian “Hasil Patch Management” di bawah mencatat tindakan yang dilakukan setelah inventarisasi dan atas permintaan pembaruan. `security/lynis-before.txt` tidak diubah dan audit Lynis AFTER tidak dijalankan.

## Hasil Patch Management

Pembaruan dilakukan pada 2026-11-07 setelah menjalankan `sudo apt-get update` untuk menyegarkan metadata. Sesudah itu target dipilih dari paket terpasang yang upgradable dengan candidate pada pocket `resolute-security`. Sebelum pemasangan dilakukan simulasi APT; simulasi tidak mengusulkan penghapusan. Upgrade dijalankan terhadap target tersebut dengan `--only-upgrade --no-remove`, tanpa `full-upgrade` atau `dist-upgrade`.

| Hasil | Status aktual |
|---|---|
| Metadata APT | `apt-get update` berhasil; proses berlanjut ke inventarisasi candidate dan simulasi. |
| Target security-origin | 123 paket |
| Paket diperbarui | 123 paket berhasil dikonfigurasi; APT melaporkan `123 upgraded`. |
| Paket baru dipasang | 0 |
| Paket dihapus | 0 |
| Paket masih belum diperbarui | 70 |
| Kegagalan upgrade paket | Tidak ada yang dilaporkan; perintah upgrade berakhir `UPGRADE_EXIT=0`. |
| Sisa kendala/peringatan | Trigger systemd melaporkan `Failed to get properties: Transport endpoint is not connected` dan `Failed to connect to system scope bus via local transport: Connection refused`. Trigger `sudo` memperingatkan link group `sudo` sebelumnya broken dan memaksa pemasangan ulang alternatif. Trigger sertifikat melewati `ca-certificates.crt` yang tidak berisi tepat satu sertifikat/CRL; trigger Python Twisted mengeluarkan `SyntaxWarning` tentang `return` dalam `finally`. Transaksi tetap berakhir dengan exit code 0; pemeriksaan systemd sesudahnya berhasil. |

Paket yang berhasil diperbarui:

```text
diffutils, gzip, perl-base, libc-gconv-modules-extra, libc6, libbz2-1.0, zlib1g, sed, tar, libsmartcols1, libblkid1, libmount1, libuuid1, util-linux, libc-bin, liblzma5, openssl-provider-legacy, libssl3t64, libapt-pkg7.0, libgcrypt20, gpgv, apt, gnu-coreutils, libpam-runtime, libpam0g, libpam-modules-bin, libpam-modules, libattr1, libpcre2-8-0, libgnutls30t64,
libexpat1, bubblewrap, libgraphite2-3, wsl-pro-service, liblcms2-2, libaom3, bsdextrautils, wget, bsdutils, python3-jwt, gawk, distro-info-data, libxml2-16, libbrotli1, libpython3.14-minimal, libsqlite3-0, rsyslog, libnghttp2-14, krb5-locales, locales, libkrb5support0, tzdata, eject, libglib2.0-0t64, libglib2.0-data, python3.14-gdbm, libx11-data, gnupg-l10n, python3-cryptography, libavahi-common-data,
xz-utils, libpng16-16t64, python3-idna, sudo, gir1.2-glib-2.0, libk5crypto3, python3-urllib3, libfdisk1, nano, mount, perl-modules-5.40, gpgconf, python3-pyasn1, git-man, libx11-6, libkrb5-3, libevent-core-2.1-7t64, libssh2-1t64, openssl, libjxl0.11, python3.14-minimal, gpg, libpolkit-gobject-1-0, sudo-rs, rsync, gnupg-utils, login, libx11-xcb1, gpg-agent, libgirepository-2.0-0,
libpython3.14-stdlib, libxtst6, gpgsm, libavahi-common3, libglib2.0-bin, gir1.2-girepository-3.0, fdisk, librsvg2-2, libperl5.40, dirmngr, ca-certificates, perl, libfreetype6, python3-twisted, python3-requests, libgssapi-krb5-2, librsvg2-common, gnupg, python3-httplib2, libpython3.14, libpolkit-agent-1-0, python3.14, libavahi-client3, polkitd, gpg-wks-client, libcurl4t64, libcurl3t64-gnutls, git, curl, libcups2t64,
libheif-plugin-aomdec, libheif1, libheif-plugin-aomenc
```

### Verifikasi Pasca-Upgrade

- `ssh.service` dan `ssh.socket` berstatus `active`; listener tetap tersedia pada port 22.
- `sudo sshd -t` berhasil (`SSHD_CONFIG_VALID`).
- `sudo sshd -T` tetap menghasilkan `port 22`, `permitrootlogin no`, `passwordauthentication no`, `pubkeyauthentication yes`, `maxauthtries 3`, `x11forwarding no`, dan `allowusers intanlucu`.
- Uji Windows-to-WSL menggunakan key dengan `BatchMode=yes` berhasil; `whoami` menghasilkan `intanlucu` dengan exit code 0.
- `openssh-server` dan `openssh-client` tetap pada `1:10.2p1-2ubuntu3.8`, sama dengan candidate yang tersedia saat inventarisasi. Keduanya tidak termasuk paket yang perlu dinaikkan oleh transaksi ini.
- Indeks APT sesudah pembaruan menunjukkan 70 paket masih upgradable. Paket-paket tersebut tidak diperbarui dalam transaksi security-only ini.

Tidak ada konfigurasi SSH atau data/configuration PostgreSQL yang diubah. `security/lynis-before.txt` tetap tidak berubah dan audit Lynis sesudah hardening tidak dijalankan.
