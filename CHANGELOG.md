# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## UNRELEASED - 2015-05-07
### Fixed
- issue with copyright info hiding on top of contacts & settings buttons #543
- ritrat moved to rr.lavaboom.com

### Added
- public keys: display prettified fingerprint both in contacts and settings
- settings/keys shows some advanched parameters such as strength and expiration date
- request public key
- send public key
## Removed
- contact star/delete icon from the top panel, already covered in the edit mode

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
### Fixed
- fixed minor issue with html sanitizing and style preserving
### Added
- proper edit mode for contacts
- email's from/to fields are now clickable and support context menu(reply/add contact)
- compose screen autofocus
- embedded styles setting, defaults: block
- confirmations support for various actions such as deletion and password change

## 0.2.4 - 2015-04-14
### Fixed
- various small fixes/improvements in contacts/compose/threads
- fixed hidden contacts creation issue
### Added
- threads: sort by modification date now

## 0.2.3 - 2015-04-14
### Fixed
- fixed language switch in settings/general
- fixed issue with corrupted plan display on settings/plan
- fixed contacts staring functionality
- re-added removed pro-users functionality on settings/keys(is key decrypted, manually keys decryption)
### Added
- preserve position and key collapse state for settings/keys on keyring update to prevent unwanted wiggling
- contacts: remove replaced hidden contacts not only on contact's creation but also on contact's update

## 0.2.2 - 2015-04-13
### Fixed
- fixed UX issue with contacts ad auto-focus
- fixed some errors in initialization and i18n bugs(timeAgo)
### Added
- display version and "served by" over logout button

## 0.2.1 - 2015-04-13
### Fixed
- fixed cancel button to cancel edit move not to remove the contact
- fixed some usability flaws in contacts
### Added
- proper edit mode for contacts implemented

## 0.2.0 - 2015-04-10
It's finally here Lavaboom 2.0, starting from there changelog is going to be more useful ;)

## 0.1.1 - 2015-03-11
### Added
- external images filter

## 0.1.0 - 2015-03-10
### Added
- CHANGELOG.md created
