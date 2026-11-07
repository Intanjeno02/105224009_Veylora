# Password blocklist attribution

The digest list in `password-blocklist.sha256` is derived from
[Probable-Wordlists](https://github.com/berzerk0/Probable-Wordlists), maintained
by berzerk0, specifically
[`Top304Thousand-probable-v2.txt`](https://github.com/berzerk0/Probable-Wordlists/blob/8ed574a02cbf37a9205344d4e31468a05989ca37/Real-Passwords/Top304Thousand-probable-v2.txt)
at repository revision
[`8ed574a02cbf37a9205344d4e31468a05989ca37`](https://github.com/berzerk0/Probable-Wordlists/commit/8ed574a02cbf37a9205344d4e31468a05989ca37).
The upstream README identifies SecLists, Weakpass, and Hashes.org as sources
for its real-password lists.

The upstream work is licensed under
[Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
This derived list is distributed under the same license.

Changes made: entries shorter than 15 Unicode code points after NFC
normalization were excluded; each remaining entry was replaced with its
lowercase SHA-256 digest of the NFC-normalized UTF-8 bytes; duplicate digests
were removed and the results sorted. The resulting list contains 2,097
digests. No source password entries are included in this repository.

The upstream project describes its lists as lawful, ethical, and educational
use only and provides them without warranty. It also notes that its license
may not grant all permissions needed for every use, including rights related
to privacy. This application uses the list only for local, exact-match
registration checks; passwords are not sent to an external service.
