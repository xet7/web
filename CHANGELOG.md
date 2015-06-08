# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 0.4.3 - 2015-06-08
### Added
- auto detect user's language
- translation for labels(Inbox/Sent/...)
- quotes in emails are collapsed by default
- contacts import(csv for gmail and outlook formats, vcard)
- refresh threads button for checking new threads/emails
- transifex support and french (provided by Cedric Morin) language

### Modified
- unified and merged translation files for core apps for a proper transifex support
- encrypted contacts can be removed in edit mode
- use settings firstName + lastName in key during the import
- better support for blockquote elements in replied and forwarded emails
- better German language support

### Fixed
- properly switch translation right after logout
- no blinking loading sign when switching between threads
- no more messed up formatting during reply-to/forward actions
- various issues with non-locked buttons when some action performs
- double encryption issue on compose screen

## 0.4.2 - 2015-05-29
### Fixed
- private key should not be empty after key backup export when Lavaboom Sync is active
- keys export: export file name shouldn't change when exporting the same key
- contacts: delete should not trigger auto-save
- contacts: crash if there is empty contact
- i18n: fixed some strings, added Deutsch support
- gulpfile: added linting for i18n files

## 0.4.1 - 2015-05-28
### Added
- email formatting standardized between compose screen & email display
- compose screen responsive updates: modal window takes full screen, more space for email addresses
- compose: email addresses are run though a filter so emails are now displayed twice per tag

## 0.4.0 - 2015-05-27
### Added
- plugins based architecture
- unit/integration tests for crypto operations
- initial support for responsiveness

### Modified
- it's now possible to use html inside i18n notifications
- removed aggressive text pre processing on editor paste
- subject and addresses now utilize q-encoding(https://tools.ietf.org/html/rfc2047#section-4.2)
- small improvements in compose screen(email context menu)

### Fixed
- mark thread as read only if all emails have been decrypted
- workaround for caja sanitizer to preserve embed images
- use styled email address in from field during email send
- issue with multiple proxying images - don't proxy already processed images(reply-to, forward, etc)
- shouldn't be possible to reply to yourself emails
- manifest address parsing is rock stable now, with proper fallback
- issue with 3rdparty keyring import

## 0.3.7 - 2015-05-19
### Fixed
- remove notifications regarding crypto after key decryption

### Modified
- routes for labels are now lower cased
- logo leads to lavaboom.com
- proper informational messages for keyring import under settings/security
- no warning if no backup available when Lavaboom Sync is being disabled

## 0.3.6 - 2015-05-19
### Fixed
- removed reference to a missing Lavaboom Sync Keys state
- show correct error when server returns "weak password"
- sanitizer shouldn't wipe all links and styles
- email: links to the same location can be opened in the same window

### Modified
- settings/plans reworked, clickable 'zero-knowledge' links

## 0.3.5 - 2015-05-18
### Fixed
- web crypto detection warnings
- different issues with gulpfile
- Inbox should be default when app loads in the first time
- issue with templates compilation which leaded to hexstrings in email bodies

### Modified
- version/served by text

## 0.3.4 - 2015-05-18
### Added
- generate new key pair button under settings/keys

### Modified
- now using google caja html sanitizer which seems to work much better and can process almost any html

### Fixed
- some minor issues with notifications
- issue during compose screen initialization that lead to duplicated attached public keys

## 0.3.3 - 2015-05-15
### Fixed
- templates(signature mostly, reply, forward, etc)
- text-angular paste processing
- save contact automatically if user leaves state in edit mode
- more shortcuts fixes and improvements

## 0.3.2 - 2015-05-15
### Added
- contacts request public key, attach own public key by default

### Fixed
- keyring backup url
- private key persistence
- Lavaboom Sync
- plain/text unencrypted attachments to unsecure destinations(binary support is in todo)
- disallow import public keys in security/settings

## 0.3.1 - 2015-05-13
### Added
- build system: finally proper incremental builds for browserify
- build system: update bower components on bower.json change and recompile
- initial email aliases support

### Modified
- build system: livereload works smarter now and without hacks
- shortcuts improved: added (g) goto, better legend
- key header now shows name + email not just email

### Fixed
- send public key, correct file name
- various improvements in attachments handling && display
- multiple bugfixes in shortcuts
- search issue
- "download button" when no decrypted private key found
- private key import when key user.name does not conform to `name <email>` syntax

## 0.3.0 - 2015-05-13
### Added
- check for browser: downloads from all Safari and some outdated results in a warning
- check for browser: display a warning on mobile browsers as we don't support them currently
- a warning into keyring backup for way too smart browsers who opens the file instead of saving
- signup: simple performance test to give user a guess about ETA

## 0.2.17 - 2015-05-13
### Added
- opnepgp.js updated, added support for native key generation in Safari
- fixed issue with not-visible keys for newly created accounts(re-login required)

## 0.2.16 - 2015-05-12
### Added
- plain/text mode for compose screen
- settings/general: autocomplete @lavaboom.com

### Modified
- gulpfile refactored into es6, now using gulp 4.x && node 0.12.x as a build system
- auto-complete of @lavaboom.com turned off by default
- new improved keys persistence and display model
- signup: this is private PC moved to password screen
- signup: merged sync and backup screens
- decrypting threads 1-by-1 instead of blocking while the whole bulk is being decrypted

### Fixed
- fixed unability to export public key in settings/security
- some notifications could appear without a reason(wrong initialization order)
- fixed reconnection when connect has been lost
- fixed notification not working after reconnection
- fixed some bugs in gulpfile(slow build, livereload, linting issues)
- various keys management issues
- public key export for setting/security

## 0.2.15 - 2015-05-12
### Fixed
- keys notifications behaviour fixed
- fixed keys export/import issue when exporting just one keypair
- key expire set to high value: this functionality isn't supposed to be used now

## 0.2.14 - 2015-05-10
### Added
- show styled email address in settings/keys
- notification if no decrypted private key found

## 0.2.13 - 2015-05-10
### Fixed
- show styled email address in compose screen from field
- temporary restored import/export buttons

## 0.2.12 - 2015-05-09
### Fixed
- bug in email encryption process

## 0.2.11 - 2015-05-08
### Modified
- no commented code in html anymore on production

### Fixed
- buggy auto-save triggered immediately without delay

## 0.2.10 - 2015-05-08
### Added
- last email: reply to, reply to all, forward the whole thread
- download original email button added
- proper error handling for email post processing 
- guidelines to the user what to do if we failed to display his email(download original email)
- compose screen reworked, added attachment button

### Fixed
- fixed reply to all

## 0.2.9 - 2015-05-07
### Added
- public keys: display prettified fingerprint both in contacts and settings
- settings/keys shows some advanched parameters such as strength and expiration date
- request public key
- send public key
- support for embedded openpgp envelopes - will be decoded automatically
- added loading sign for the time while email is being post-processed

## Removed
- contact star/delete icon from the top panel, already covered in the edit mode

### Fixed
- issue with copyright info hiding on top of contacts & settings buttons #543
- ritrat moved to rr.lavaboom.com
- fixed issues with public keys storage in contacts(unified)
- smarter order address book in compose screen, secured addresses go first
 
## 0.2.8 - 2015-05-06
### Fixed
- issue with threads caching that caused threads to temporary disappear until page refresh
- threads and labels cache expire time set to high value as we never need this auto-expire behavior

## 0.2.7 - 2015-05-06
### Fixed lots of issues
- issue with showing errors during signup/login
- multiple issues with thread/emails
- other small bugs

## 0.2.6 - 2015-04-17
### Fixed
- issue with BOM in manifest.json

## 0.2.5 - 2015-04-17
### Added
- proper edit mode for contacts
- email's from/to fields are now clickable and support context menu(reply/add contact)
- compose screen autofocus
- embedded styles setting, defaults: block
- confirmations support for various actions such as deletion and password change

- ### Fixed
- fixed minor issue with html sanitizing and style preserving

## 0.2.4 - 2015-04-14
### Added
- threads: sort by modification date now

### Fixed
- various small fixes/improvements in contacts/compose/threads
- fixed hidden contacts creation issue

## 0.2.3 - 2015-04-14
### Added
- preserve position and key collapse state for settings/keys on keyring update to prevent unwanted wiggling
- contacts: remove replaced hidden contacts not only on contact's creation but also on contact's update

### Fixed
- fixed language switch in settings/general
- fixed issue with corrupted plan display on settings/plan
- fixed contacts staring functionality
- re-added removed pro-users functionality on settings/keys(is key decrypted, manually keys decryption)

## 0.2.2 - 2015-04-13
### Added
- display version and "served by" over logout button

### Fixed
- fixed UX issue with contacts ad auto-focus
- fixed some errors in initialization and i18n bugs(timeAgo)

## 0.2.1 - 2015-04-13
### Added
- proper edit mode for contacts implemented

### Fixed
- fixed cancel button to cancel edit move not to remove the contact
- fixed some usability flaws in contacts

## 0.2.0 - 2015-04-10
### Added
- It's finally here Lavaboom 2.0, starting from there changelog is going to be more useful ;)

## 0.1.1 - 2015-03-11
### Added
- external images filter

## 0.1.0 - 2015-03-10
### Added
- CHANGELOG.md created
