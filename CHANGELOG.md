# Changelog

## 3.1.0 — 2026-08-18

### BREAKING for 17.2 only: elements reconciled to the separately issued 17.2 visualisation page

17.2 has no page in the main PDF (noted in 3.0.0). Its single-page visualisation (`CIS v8.1 - Control 17-2.pdf`, image-only) was supplied afterwards and read visually; 17.2's buckets now match it under the same rules as 3.0.0. **Only 17.2 changed** — re-draft 17.2 alone. Every other safeguard is byte-for-byte identical to 3.0.0.

#### 17.2 Establish and Maintain Contact Information for Reporting Security Incidents (page: CIS v8.1 - Control 17-2.pdf) — **corrected**

- Removed: `establish and maintain contact information for parties that need to be informed of security incidents` (G); `verify contacts annually to ensure information is up-to-date` (G); `contact information for parties to notify about security incidents` (C); `internal and external notification contacts` (C); `annual verification of contact information` (C); `contacts may include internal staff` (S); `cyber insurance providers` (S); `Information Sharing and Analysis Center (ISAC) partners` (S); `or other stakeholders` (S); `incident notification contact directory` (I); `emergency contact lists` (I); `stakeholder contact registers` (I); `annual contact verification process` (I)

- Moved: `verify contacts annually` S→G; `service providers` S→I; `law enforcement` S→I; `relevant government agencies` S→I

- Added: `Establish` (G); `Maintain` (G); `Ensure information is up-to-date` (G); `Contact Information for Reporting Security Incidents` (C); `Internal staff` (I); `Cyber insurance provider` (I); `ISAC` (I); `Other Stakeholders` (I)

## 3.0.0 — 2026-08-18

### BREAKING: safeguard element strings reconciled to the governing CIS v8.1 visualisation PDF

Downstream consumers pin exact element strings (`elementRefs`). This release adds, removes, moves and — where an existing string did not match the PDF wording — replaces element strings across **147 of 153 safeguards**. Re-draft only the safeguards listed under *Corrected* below; those under *Already faithful* are byte-for-byte unchanged.

**Ground truth:** [CIS v8.1 Safeguard Visualisations](https://frameworkmaps.org/assets/CISv8.1-Visualisations-2025-5_MattLee.pdf). Each safeguard's four buckets now match its page's colour-coded shapes element-for-element: orange hexagon → `governanceElements`, green box → `coreRequirements`, yellow parallelogram → `subTaxonomicalElements`, gray trapezoid contents → `implementationSuggestions`. The reconciled sets are shipped in `data/cis-v8.1-visualisation-elements.json` (with the PDF page for each safeguard) and enforced by `scripts/verify-cis-elements.mjs` in `npm test` / CI, so drift now fails the build.

**Totals:** 381 elements kept verbatim, 198 moved to a different bucket, 664 added from the PDF, 1353 removed as not present in the PDF.

**Rules applied** (also recorded in the data file):

- An existing element that matched a PDF shape (case/punctuation-insensitive) was kept with its existing string; PDF strings were only introduced where nothing matched.
- Numeric thresholds and "do not" restrictions (salmon/red shapes) are recorded in `governanceElements`.
- Blue "called-out tool" triangles take the bucket of the box containing them.
- Excluded as informational: title, highlighted description banner, related-safeguard circles, Or/And/If diamonds, OS-dependent stars, and the top-right IG / function / asset-type / Cost-of-Cyber-Defense boxes.
- PDF typos corrected: `Enteprise Assets` (7.3) → `Enterprise Assets`; `"Seperate" enterprise workspaces` (4.12) → `Separate enterprise workspaces`; stray `impact this Safeguard` tail trimmed from the 15.4 review hexagon.
- **17.2 has no page in the PDF.** Its elements were reconciled against the official CIS v8.1.2 text only (unchanged from 2.7.1, which already did that).

### Affected safeguard IDs (re-draft these)

1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.10, 4.12, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10, 16.11, 16.12, 16.13, 16.14, 17.1, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 18.1, 18.2, 18.3, 18.4, 18.5

### Already faithful (unchanged)

2.4, 4.9, 4.11, 5.6, 6.2 — plus 17.2 (no PDF page; unchanged, text-reconciled)

### Per-safeguard record

Buckets: G = governanceElements, C = coreRequirements, S = subTaxonomicalElements, I = implementationSuggestions.

#### 1.1 Establish and Maintain Detailed Enterprise Asset Inventory (PDF p.13) — **corrected**

- Removed: `Review and update the inventory of all enterprise assets bi-annually, or more frequently` (G); `Asset inventory of all enterprise assets with the potential to store or process data` (C)

- Moved: `Up-to-date` S→G

- Added: `Review and update the inventory of all enterprise assets` (G); `more frequently` (G); `bi-annually` (G); `Ensure` (G); `Asset Inventory` (C)

- Kept: `Establish` (G); `Maintain` (G); `Connected to Infrastructure` (S); `Potential to store or process data` (S); `Remotely` (S); `Virtually` (S); `Physically` (S); `End-User Devices` (S); `IOT Devices` (S); `Network Devices` (S); `Servers` (S); `Detailed` (S); `Accurate` (S); `Mobile` (S); `Portable` (S); `Those within cloud environments` (S); `Regularly Connected Devices - NOT Under Control of Enterprise` (S); `Machine Name` (S); `Network Address (IF STATIC)` (S); `Hardware Address` (S); `Enterprise asset owner` (S); `Department for each asset` (S); `Asset has been approved to connect to the network` (S); `For mobile end-user devices, MDM type tools can support this process, where appropriate` (I)

#### 1.2 Address Unauthorized Assets (PDF p.14) — **corrected**

- Removed: `Ensure that a process exists to address unauthorized assets on a weekly basis` (G); `Address Unauthorized Assets` (C); `Address Unauthorized Assets` (S); `The enterprise may choose to remove the asset from the network, deny the asset from connecting remotely to the network, or quarantine the asset` (I)

- Added: `Ensure` (G); `On a weekly basis` (G); `Remove the asset from the network` (I); `Deny the Asset from connecting remotely to the network` (I); `Quarantine the asset` (I)

#### 1.3 Utilize an Active Discovery Tool (PDF p.15) — **corrected**

- Removed: `Utilize an active discovery tool` (G); `Configure the active discovery tool to execute daily, or more frequently` (G)

- Moved: `Utilize` S→G; `Configure` S→G; `Execute daily, or more frequently` S→G

- Added: `Execute daily` (G); `Identify Assets Connected To Network` (S)

- Kept: `Active discovery tool` (C)

#### 1.4 Use Dynamic Host Configuration Protocol (DHCP) Logging to Update Enterprise Asset Inventory (PDF p.16) — **corrected**

- Removed: `Use DHCP logging on all DHCP servers or Internet Protocol (IP) address management tools to update the enterprise's asset inventory` (G); `Review and use logs to update the enterprise's asset inventory weekly, or more frequently` (G); `Or IPAM` (C); `This is an OR of the two above, but can be in conjunction` (C)

- Moved: `Review and Use Logs` S→G; `Update asset inventory` S→G

- Added: `Use` (G); `Weekly` (G); `More Frequently` (G); `IPAM Tool` (C); `IPAM` (C)

- Kept: `DHCP Logging on all DHCP servers` (C)

#### 1.5 Use a Passive Asset Discovery Tool (PDF p.17) — **corrected**

- Removed: `Use a passive discovery tool to identify assets connected to the enterprise's network` (G); `Review and use scans to update the enterprise's asset inventory at least weekly, or more frequently` (G)

- Moved: `Review and Use scans` S→G; `Update asset inventory` S→G

- Added: `Use` (G); `Weekly` (G); `More Frequently` (G); `Identify Assets Connected To Network` (S)

- Kept: `Passive Discovery Tool` (C)

#### 2.1 Establish and Maintain a Software Inventory (PDF p.19) — **corrected**

- Removed: `Establish a Software Inventory` (G); `The software inventory must document the sub-taxonomical elements, where appropriate` (G); `Review and update the software inventory bi-annually, or more frequently - AKA Maintain` (G)

- Added: `Establish` (G); `Maintain` (G); `Review and update software inventory` (G); `bi-annually` (G); `More Frequently` (G); `Must Document` (G); `Where appropriate` (G); `Installed* on enterprise Assets` (S)

- Kept: `Detailed inventory of all licensed software` (C); `Business Purpose` (S); `Title` (S); `Publisher` (S); `Initial Install / Use Date` (S); `Decomm. Date` (S); `Deployment mechanism` (S); `URL` (S); `App Store(s)` (S); `App Version(s)` (S)

#### 2.2 Ensure Authorized Software is Currently Supported (PDF p.20) — **corrected**

- Removed: `Ensure that only currently supported software is designated as authorized in the software inventory for enterprise assets. If software is unsupported, yet necessary for the fulfillment of the enterprise's mission, document an exception detailing mitigating controls and residual risk acceptance. For any unsupported software without an exception documentation, designate as unauthorized. Review the software list to verify software support at least monthly, or more frequently.` (G); `Document Exception detailing mitigating controls IF Unsupported` (S); `Document Residual risk acceptance IF Unsupported` (S)

- Added: `Ensure` (G); `Review the software list` (G); `Monthly` (G); `More frequently` (G); `Unsupported` (G); `Document Exception detailing mitigating controls` (S); `Document Residual risk acceptance` (S)

- Kept: `Currently supported software` (C); `Authorized in the software inventory` (C); `Determine if Authorized Software Is Currently Supported` (S); `Determine Necessity for Business` (S)

#### 2.3 Address Unauthorized Software (PDF p.21) — **corrected**

- Removed: `Review monthly, or more frequently` (G); `unauthorized software is either removed from use on enterprise assets or receives a documented exception` (C); `Address Unauthorized Software` (S)

- Added: `Review` (G); `Monthly` (G); `More Frequently` (G)

- Kept: `Ensure` (G); `Document Exception` (S); `Remove from use` (S)

#### 2.4 Utilize Automated Software Inventory Tools (PDF p.22) — **already-faithful**

- No changes.

#### 2.5 Allowlist Authorized Software (PDF p.23) — **corrected**

- Removed: `Reassess bi-annually, or more frequently` (G); `only authorized software can execute or be accessed` (C); `Allow software to Execute` (S); `Allow software to be Accessed` (S)

- Moved: `technical controls` C→S

- Added: `Reassess` (G); `Bi-Annually` (G); `More Frequently` (G); `Accessed` (S); `Execute` (S)

- Kept: `Use` (G); `Ensure` (G); `Application Allowlisting` (I)

#### 2.6 Allowlist Authorized Libraries (PDF p.24) — **corrected**

- Removed: `Reassess bi-annually, or more frequently` (G)

- Added: `Reassess` (G); `Bi-Annually` (G); `More Frequently` (G)

- Kept: `Use` (G); `Ensure` (G); `only authorized software libraries` (C); `are allowed to load into a system process` (C); `Technical Controls` (S); `Block unauthorized libraries from loading into a system process` (S); `Specific .so files` (I); `Specific .dll files` (I); `Specific .ocx files` (I)

#### 2.7 Allowlist Authorized Scripts (PDF p.25) — **corrected**

- Removed: `Reassess bi-annually, or more frequently` (G)

- Added: `Reassess` (G); `Bi-Annually` (G); `More Frequently` (G)

- Kept: `Use` (G); `Ensure` (G); `only authorized files are allowed to execute` (C); `Technical Controls` (S); `Block unauthorized scripts from executing` (S); `Specific .ps1 files` (I); `Specific .py files` (I); `Digital signatures` (I); `Version control` (I)

#### 3.1 Establish and Maintain a Data Management Process (PDF p.27) — **corrected**

- Removed: `Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard` (G)

- Added: `Review and update documentation` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G)

- Kept: `Establish` (G); `Maintain` (G); `documented data management process` (C); `Data Sensitivity` (S); `Data Owner` (S); `Retention Standards` (S); `Data Retention Limits` (S); `Disposal Requirements` (S); `Data Handling` (S)

#### 3.2 Establish and Maintain a Data Inventory (PDF p.28) — **corrected**

- Removed: `Review and update inventory annually, at a minimum, with a priority on sensitive data` (G)

- Added: `Annually, at a minimum` (G); `Review and update inventory` (G); `Priority on sensitive data` (G)

- Kept: `Establish` (G); `Maintain` (G); `data inventory` (C); `Based on Data Management process` (S); `Sensitive Data at a Minimum` (S)

#### 3.3 Configure Data Access Control Lists (PDF p.29) — **corrected**

- Removed: `Software` (S)

- Added: `Applications` (S)

- Kept: `Configure` (G); `data access control lists` (C); `ACLS - "aka" Access Permissions` (S); `Based on "Need to Know"` (S); `Local` (S); `Remote File Systems` (S); `Databases` (S)

#### 3.4 Enforce Data Retention (PDF p.30) — **corrected**

- Removed: `must include both minimum and maximum timelines` (G); `data according to the enterprise's documented data management process` (C)

- Added: `Must Include` (G)

- Kept: `Retain` (G); `Enforce` (G); `Data retention` (C); `Minimum Timelines` (S); `Maximum timelines` (S)

#### 3.5 Securely Dispose of Data (PDF p.31) — **corrected**

- Removed: `Securely Dispose of Data` (C); `Securely dispose of Data` (S)

- Kept: `Ensure` (G); `Disposal process and method are commensurate with the data sensitivity` (G)

#### 3.6 Encrypt Data on End-User Devices (PDF p.32) — **corrected**

- Removed: `that contain Sensitive data` (S)

- Added: `Sensitive data` (S)

- Kept: `Encrypt` (G); `data on end-user devices` (C); `Windows Bitlocker` (I); `Apple FileVault` (I); `Linux dm-crypt` (I)

#### 3.7 Establish and Maintain a Data Classification Scheme (PDF p.33) — **corrected**

- Removed: `Review and update the classification scheme annually, or when significant enterprise changes occur that could impact this Safeguard` (G)

- Added: `Review and update classification scheme` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G)

- Kept: `Establish` (G); `Maintain` (G); `data classification scheme` (C); `Classify their data according to labels` (S); `Sensitive` (I); `Confidential` (I); `Public` (I)

#### 3.8 Document Data Flows (PDF p.34) — **corrected**

- Removed: `Document data flows` (G); `Document Data Flows` (C)

- Added: `Review and update documentation` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Annually` (G)

- Kept: `Enterprise Data Flows` (S); `Service Provider Data Flows` (S)

#### 3.9 Encrypt Data on Removable Media (PDF p.35) — **corrected**

- Removed: `Encrypt` (G); `Encrypt Data on Removable Media` (C)

- Moved: `Data on Removable Media` S→C

- Added: `Maintain` (G)

#### 3.10 Encrypt Sensitive Data in Transit (PDF p.36) — **corrected**

- Removed: `Encrypt sensitive data in transit` (C)

- Moved: `Sensitive data in transit` S→C

- Kept: `Encrypt` (G); `TLS` (I); `OpenSSH` (I)

#### 3.11 Encrypt Sensitive Data at Rest (PDF p.37) — **corrected**

- Removed: `Encrypt sensitive data at rest` (C); `Sensitive Data At Rest` (S)

- Kept: `Encrypt` (G); `Minimum Requirement` (G); `Servers` (S); `Applications` (S); `Databases` (S); `Storage Layer (server side) encryption` (S); `Application layer (client-side) encryption` (I); `Where access to the data storage device(s) does not permit access to the plain-text data` (I)

#### 3.12 Segment Data Processing and Storage Based on Sensitivity (PDF p.38) — **corrected**

- Removed: `Segment Data Processing` (C); `Segment Data Storage` (C); `Based on Sensitivity` (C)

- Added: `Based on the sensitivity of data` (C); `Segment data processing (compute)` (C); `Segment Storage` (C)

- Kept: `Do not process sensitive data on enterprise assets intended for lower sensitivity data` (G)

#### 3.13 Deploy a Data Loss Prevention Solution (PDF p.39) — **corrected**

- Removed: `automated tool to identify all sensitive data` (C); `Transmitted` (S)

- Moved: `Identify all sensitive Data` S→C

- Added: `Automated DLP Tool` (C); `Transmitte d` (S)

- Kept: `Implement` (G); `Stored` (S); `Processed` (S); `Update Data Inventory` (S); `Remote Service Provider` (S); `Onsite Data` (S); `Host-based Data loss Prevention (DLP) tool` (I)

#### 3.14 Log Sensitive Data Access (PDF p.40) — **corrected**

- Removed: `Log sensitive data access, including modification and disposal` (C)

- Added: `Sensitive Data access` (C); `Access` (C); `Modification` (C); `Disposal` (C)

- Kept: `Log` (G)

#### 4.1 Establish and Maintain a Secure Configuration Process (PDF p.42) — **corrected**

- Removed: `Review and update documentation` (G); `Non-computing/IoT devices` (S)

- Added: `Review and update documentati on` (G); `Applications` (S); `Non-computing/I oT devices` (S)

- Kept: `Establish` (G); `Maintain` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `documented secure configuration process` (C); `Enterprise assets` (S); `Software` (S); `OS` (S); `End-user devices` (S); `Servers` (S); `Mobile` (S); `Portable` (S)

#### 4.2 Establish and Maintain a Secure Configuration Process for Network Infrastructure (PDF p.43) — **corrected**

- Removed: `documented secure configuration process` (C)

- Added: `Documented Secure Network Configuration Process` (C)

- Kept: `Establish` (G); `Maintain` (G); `Review and update documentation` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Annually` (G); `Network devices` (S)

#### 4.3 Configure Automatic Session Locking on Enterprise Assets (PDF p.44) — **corrected**

- Removed: `automatic session locking on enterprise assets` (C); `General Purpose OSs` (S)

- Added: `Automatic Session Locking` (C); `General Purpose OS's` (S)

- Kept: `Configure` (G); `Period must not exceed for 15 Minutes` (G); `Period must not exceed for 2 Minutes` (G); `Period of inactivity` (S); `Mobile end-user devices` (S)

#### 4.4 Implement and Manage a Firewall on Servers (PDF p.45) — **corrected**

- Removed: `firewall on servers` (C)

- Moved: `Server Firewall` S→C

- Kept: `Implement` (G); `Manage` (G); `Where Supported` (G); `Virtual Firewall` (I); `OS Firewall` (I); `Third Party Firewall` (I)

#### 4.5 Implement and Manage a Firewall on End-User Devices (PDF p.46) — **corrected**

- Removed: `host-based firewall or port-filtering tool on end-user devices` (C); `Firewall` (I); `Configuration Management Tool` (I)

- Added: `Port Host-Filtering based Tool Firewall` (C); `End User Devices` (C)

- Kept: `Implement` (G); `Manage` (G); `Default Deny Rule that drops all traffic` (S); `Except Explicitly Allowed` (S); `Services` (S); `Ports` (S)

#### 4.6 Securely Manage Enterprise Assets and Software (PDF p.47) — **corrected**

- Removed: `Securely manage enterprise assets and software` (C); `Securely manage enterprise assets and software` (S); `Do not use insecure management protocols unless operationally essential` (S); `SSH instead of TELNET` (I); `HTTPS instead of HTTP` (I)

- Moved: `Unless operationally essential` G→S

- Added: `Telnet (Teletype Network)` (I); `HTTP` (I); `SSH` (I); `HTTPS` (I)

- Kept: `Do not use insecure management protocols` (G); `Manage configuration through version-controlled Infrastructure-as-Code (IaC)` (I); `Accessing administrative interfaces over secure network protocols` (I)

#### 4.7 Manage Default Accounts on Enterprise Assets and Software (PDF p.48) — **corrected**

- Removed: `Disabling them` (I); `making them Unusable` (I); `Root, Administrator, or other pre-configured vendor accounts` (I)

- Added: `Disabling` (I); `Unusable` (I); `Root` (I); `Administrator` (I); `Other pre-configured vendor accounts` (I)

- Kept: `Manage` (G); `default accounts` (C); `Enterprise assets` (S); `Software` (S)

#### 4.8 Uninstall or Disable Unnecessary Services on Enterprise Assets and Software (PDF p.49) — **corrected**

- Removed: `Unused File Sharing Services` (I)

- Added: `Unused file sharing service` (I)

- Kept: `Uninstall` (G); `Disable` (G); `unnecessary services` (C); `Enterprise assets` (S); `Software` (S); `Web Application Module` (I); `Service Function` (I)

#### 4.9 Configure Trusted DNS Servers on Enterprise Assets (PDF p.50) — **already-faithful**

- No changes.

#### 4.10 Enforce Automatic Device Lockout on Portable End-User Devices (PDF p.51) — **corrected**

- Removed: `After a Predetermined threshold of local failed authentication attempts` (S); `On Portable end-user devices` (S); `Such as Laptops` (S); `Such as Tablets and smartphones` (S); `Configuration Management Tool` (I)

- Added: `Predetermined threshold of local failed authentication attempts` (S); `Portable end-user devices` (S); `Laptops` (S); `Tablets and smartphones` (S)

- Kept: `Enforce` (G); `Where supported` (G); `Do not allow more than 20 Failed Authentication Attempts` (G); `No more than 10 Failed Authentication Attempts` (G); `automatic device lockout` (C); `Microsoft® InTune Device Lock` (I); `Apple® Configuration Profile maxFailedAttempts` (I)

#### 4.11 Enforce Remote Wipe Capability on Portable End-User Devices (PDF p.52) — **already-faithful**

- No changes.

#### 4.12 Separate Enterprise Workspaces on Mobile End-User Devices (PDF p.53) — **corrected**

- Removed: `separate enterprise workspaces are used on mobile end-user devices` (C); `Enterprise Applications and Enterprise Data` (S); `Seperate from Personal Applications and Personal Data` (S)

- Added: `Separate enterprise workspaces` (C); `On Mobile Devices` (C); `Separate` (C); `Enterprise Data` (S); `Enterprise Applications` (S); `Personal Data` (S); `Personal Applications` (S)

- Kept: `Ensure` (G); `Where Supported` (G); `Apple® Configuration Profile` (I); `AndroidTM Work Profile` (I)

#### 5.1 Establish and Maintain an Inventory of Accounts (PDF p.55) — **corrected**

- Removed: `Establish and maintain` (G); `Validate that all active accounts are authorized, on a recurring schedule at a minimum quarterly, or more frequently` (G); `Service Accounts` (S)

- Added: `Establish` (G); `Maintain` (G); `Validate that all active accounts are authorized` (G); `Recurring schedule` (G); `Minimum Quarterly` (G); `More Frequently` (G)

- Kept: `Must include` (G); `Inventory of Accounts` (C); `User Accounts` (S); `Administrator Accounts` (S); `Name` (S); `Username` (S); `Start Stop Dates` (S); `Department` (S)

#### 5.2 Use Unique Passwords (PDF p.56) — **corrected**

- Removed: `At a minimum, an 8-character password for accounts using Multi-Factor Authentication (MFA) and a 14-character password for accounts not using MFA` (G)

- Added: `At a minimum` (G); `8-character password for accounts using MFA` (G); `14-character password for accounts not using MFA` (G)

- Kept: `Use` (G); `Unique Passwords` (C); `All Enterprise Assets` (S)

#### 5.3 Disable Dormant Accounts (PDF p.57) — **corrected**

- Removed: `after a period of 45 days of inactivity` (G)

- Added: `Disable` (G); `Delete` (G); `Period of 45 days of inactivity` (G)

- Kept: `where supported` (G); `Dormant Accounts` (C)

#### 5.4 Restrict Administrator Privileges to Dedicated Administrator Accounts (PDF p.58) — **corrected**

- Removed: `Such as` (I)

- Kept: `Restrict` (G); `Administrator Privileges` (C); `Dedicated Admin Accounts` (C); `Enterprise assets` (S); `User's primary, non-privileged account` (S); `General Computing Activities` (S); `Internet browsing` (I); `Email` (I); `Productivity suite use` (I)

#### 5.5 Establish and Maintain an Inventory of Service Accounts (PDF p.59) — **corrected**

- Removed: `Establish and maintain` (G); `recurring schedule at a minimum quarterly, or more frequently` (G)

- Added: `Establish` (G); `Maintain` (G); `On a recurring schedule` (G); `At a minimum quarterly` (G); `More frequently` (G)

- Kept: `Perform service account reviews to validate that all active accounts are authorized` (G); `at a minimum, must contain` (G); `Inventory of Service Accounts` (C); `Department Owner` (S); `Review date` (S); `Purpose` (S)

#### 5.6 Centralize Account Management (PDF p.60) — **already-faithful**

- No changes.

#### 6.1 Establish an Access Granting Process (PDF p.62) — **corrected**

- Removed: `documented process` (C); `granting access to enterprise assets` (C); `upon new hire` (S); `role change of a user` (S)

- Added: `Documented Access Granting Process` (C); `New Hire` (S); `Role Change` (S); `Preferably automated` (I)

- Kept: `Establish` (G); `Follow` (G); `Enterprise assets` (S)

#### 6.2 Establish an Access Revoking Process (PDF p.63) — **already-faithful**

- No changes.

#### 6.3 Require MFA for Externally-Exposed Applications (PDF p.64) — **corrected**

- Removed: `all externally-exposed enterprise or third-party applications to enforce MFA` (C); `MFA - Multi Factor Authentication` (C); `MFA for all externally exposed enterprise or third-party applications` (S); `Enforcing MFA through a directory service or SSO provider is a satisfactory implementation of this Safeguard` (I)

- Added: `MFA` (C); `ALL Externally Exposed Applications` (C); `Enforcing MFA Through` (I); `Directory service` (I); `SSO Provider` (I)

- Kept: `Require` (G); `Enforce` (G); `Where Supported` (G)

#### 6.4 Require MFA for Remote Network Access (PDF p.65) — **corrected**

- Removed: `MFA for remote network access` (C); `MFA for Remote Network Access` (S)

- Added: `MFA` (C); `Remote Network Access` (C)

- Kept: `Require` (G)

#### 6.5 Require MFA for Administrative Access (PDF p.66) — **corrected**

- Removed: `MFA on all administrative access accounts` (C); `Onsite Management accounts or Service Provider Admin Accounts` (S)

- Moved: `All Admin Access Accounts` S→C

- Added: `MFA` (C); `Onsite Management` (S); `Service Provider` (S)

- Kept: `Require` (G); `Where Supported` (G); `All enterprise assets` (S)

#### 6.6 Establish and Maintain an Inventory of Authentication and Authorization Systems (PDF p.67) — **corrected**

- Removed: `At a minimum, monthly or more frequenlty` (G); `hosted at a remote service provider` (S)

- Added: `At a minimum Annually` (G); `More frequently` (G); `Remote Service Provider` (S)

- Kept: `Establish` (G); `maintain` (G); `Review and update inventory` (G); `inventory of the enterprise's authentication and authorization systems` (C); `hosted on-site` (S)

#### 6.7 Centralize Access Control (PDF p.68) — **corrected**

- Removed: `through a directory service or SSO provider` (S); `Directory Service or SSO Provider` (S)

- Added: `Directory Service` (S); `SSO Provider` (S)

- Kept: `Centralize` (G); `Where Supported` (G); `access control` (C); `All enterprise assets` (S)

#### 6.8 Define and Maintain Role-Based Access Control (PDF p.69) — **corrected**

- Removed: `At a mimimum Annually, or more Frequently` (G); `Neccesary to Successfully carry out its assigned duties` (S)

- Added: `At a minimum Annually` (G); `More frequently` (G); `carry out its assigned duties` (S); `Identity and Access management Tool` (I)

- Kept: `Define` (G); `maintain` (G); `Perform access control reviews of enterprise assets to validate that all privileges are authorized, on a recurring schedule` (G); `Necessary` (G); `role-based access control` (C); `Determining` (S); `Documenting` (S); `Access rights` (S); `Each Role` (S)

#### 7.1 Establish and Maintain a Vulnerability Management Process (PDF p.71) — **corrected**

- Removed: `review and update documentation annually` (G); `update when significant enterprise changes occur` (G)

- Added: `Review and update documentation` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Annually` (G)

- Kept: `Establish` (G); `Maintain` (G); `vulnerability management process` (C); `documented` (C); `Enterprise Assets` (S)

#### 7.2 Establish and Maintain a Remediation Process (PDF p.72) — **corrected**

- Removed: `establish remediation process` (G); `maintain remediation process` (G); `SLA for security vulnerabilities` (G); `vulnerability remediation governance` (G); `service level agreement` (C); `security vulnerability handling` (C); `remediation timeline management` (C); `vulnerability prioritization` (S); `remediation timelines` (S); `escalation procedures` (S); `patch management integration` (S); `risk-based remediation` (S); `remediation tracking` (S); `verification procedures` (S); `vulnerability management platforms` (I); `patch management systems` (I); `remediation workflow tools` (I); `SLA tracking systems` (I); `risk scoring frameworks` (I)

- Added: `Establish` (G); `Maintain` (G); `Reviews` (G); `Monthly` (G); `More frequent` (G); `Documented` (C); `Risk based Remediation strategy` (C)

- Kept: `remediation process` (C)

#### 7.3 Perform Automated Operating System Patch Management (PDF p.73) — **corrected**

- Removed: `perform automated OS patch management` (G); `enterprise assets coverage` (G); `automated patching requirement` (G); `patch management governance` (G); `automated operating system patching` (C); `enterprise asset coverage` (C); `patch deployment automation` (C); `OS security updates` (C); `patch deployment scheduling` (S); `patch testing procedures` (S); `rollback capabilities` (S); `patch compliance monitoring` (S); `emergency patching procedures` (S); `patch approval workflows` (S); `system restart management` (S); `Windows Update Services` (I); `patch management platforms` (I); `configuration management tools` (I); `automated patching solutions` (I); `system center tools` (I)

- Added: `Perform` (G); `Monthly` (G); `More frequent` (G); `Patch Management` (C); `Automated` (C); `Enterprise Assets` (S); `Operating System Updates` (S)

#### 7.4 Perform Automated Application Patch Management (PDF p.74) — **corrected**

- Removed: `perform automated application patching` (G); `enterprise assets coverage` (G); `automated application updates` (G); `application patch governance` (G); `automated application patching` (C); `enterprise asset coverage` (C); `application security updates` (C); `patch deployment automation` (C); `application update management` (S); `third-party software updates` (S); `browser plugin updates` (S); `security patch prioritization` (S); `application compatibility testing` (S); `update rollback procedures` (S); `vendor patch notifications` (S); `application update managers` (I); `third-party patch solutions` (I); `automated deployment tools` (I); `software inventory integration` (I); `patch compliance scanners` (I)

- Added: `Perform` (G); `Monthly` (G); `More frequent` (G); `Patch Management` (C); `Automated` (C); `Application Updates` (S); `Enterprise Assets` (S)

#### 7.5 Perform Automated Vulnerability Scans of Internal Enterprise Assets (PDF p.75) — **corrected**

- Removed: `perform automated vulnerability scans` (G); `internal enterprise assets` (G); `quarterly or more frequent basis` (G); `vulnerability scanning governance` (G); `automated vulnerability scanning` (C); `internal asset coverage` (C); `quarterly scan frequency` (C); `vulnerability detection` (C); `network vulnerability scanning` (S); `host-based vulnerability scanning` (S); `application vulnerability scanning` (S); `database vulnerability scanning` (S); `scan scheduling` (S); `scan result analysis` (S); `false positive management` (S); `vulnerability scanners` (I); `network security scanners` (I); `application security scanners` (I); `automated scanning platforms` (I); `vulnerability management systems` (I)

- Added: `Perform` (G); `Quarterly` (G); `More frequent` (G); `Vulnerability Scans` (C); `Automated` (C); `Internal Assets` (C); `Authenticated` (S); `Unauthenticated` (S); `Enterprise Assets` (S)

#### 7.6 Perform Automated Vulnerability Scans of Externally-Exposed Enterprise Assets (PDF p.76) — **corrected**

- Removed: `perform automated vulnerability scans` (G); `externally-exposed enterprise assets` (G); `internal or external scanning service` (G); `external asset scanning governance` (G); `automated vulnerability scanning` (C); `externally-exposed assets` (C); `external vulnerability detection` (C); `internet-facing asset scanning` (C); `external network scanning` (S); `web application scanning` (S); `exposed service scanning` (S); `cloud asset scanning` (S); `external IP monitoring` (S); `internet exposure assessment` (S); `attack surface analysis` (S); `external vulnerability scanners` (I); `cloud security scanning` (I); `web application scanners` (I); `internet asset discovery` (I); `third-party scanning services` (I)

- Added: `Perform` (G); `Perform scans` (G); `Monthly` (G); `More frequent` (G); `Vulnerability Scans` (C); `Automated` (C); `Externally Exposed` (C); `Enterprise Assets` (S)

#### 7.7 Remediate Detected Vulnerabilities (PDF p.77) — **corrected**

- Removed: `remediate detected vulnerabilities` (G); `software vulnerability remediation` (G); `monthly or more frequent basis` (G); `vulnerability remediation governance` (G); `vulnerability remediation` (C); `detected vulnerability handling` (C); `monthly remediation cycles` (C); `software security updates` (C); `vulnerability assessment` (S); `risk-based prioritization` (S); `patch deployment` (S); `compensating controls` (S); `remediation verification` (S); `remediation tracking` (S); `exception management` (S); `vulnerability management platforms` (I); `automated remediation tools` (I); `patch management integration` (I); `remediation workflow systems` (I); `risk assessment tools` (I)

- Added: `Remediate` (G); `Monthly` (G); `More frequent` (G); `Through` (G); `Vulnerability Remediation Process` (C); `Software` (S); `Processes` (S); `Tooling` (S)

#### 8.1 Establish and Maintain an Audit Log Management Process (PDF p.79) — **corrected**

- Removed: `establish and maintain` (G); `review and update documentation annually` (G); `collection, review, and retention of audit logs` (C); `log management policy/process` (I); `documentation` (I)

- Moved: `annually` S→G; `minimum` S→G; `documented audit log management process` G→C; `enterprise assets` C→S; `enterprise's logging requirements` C→S

- Added: `Establish` (G); `Maintain` (G); `Review and update documentation` (G); `Audit logs` (S)

- Kept: `when significant enterprise changes occur that could impact this Safeguard` (G); `collection` (S); `review` (S); `retention` (S)

#### 8.2 Collect Audit Logs (PDF p.80) — **corrected**

- Removed: `collect audit logs` (C); `logging enabled` (C); `log management tool` (I); `OS dependent` (I)

- Moved: `enterprise assets` C→S

- Added: `Collect` (G); `Audit Logs` (C); `Logging` (S)

- Kept: `per the enterprise's audit log management process` (G); `enabled` (S)

#### 8.3 Ensure Adequate Audit Log Storage (PDF p.81) — **corrected**

- Removed: `comply with the enterprise's audit log management process` (G); `logging destinations maintain adequate storage` (C); `adequate storage` (S); `log management tool` (I); `potentially OS dependent` (I)

- Moved: `maintain` S→G; `comply` S→G

- Added: `Ensure` (G); `The Enterprise's audit log management process` (G); `Adequate Storage (for Logs)` (C)

- Kept: `logging destinations` (S)

#### 8.4 Standardize Time Synchronization (PDF p.82) — **corrected**

- Removed: `standardize time synchronization` (G); `configure at least two synchronized time sources` (C); `secure configuration policy/process` (I); `potentially OS dependent` (I)

- Moved: `at least two` S→G; `where supported` C→G; `enterprise assets` C→S

- Added: `Standardize` (G); `Configure` (G); `Time Syncronization` (C)

- Kept: `time sources` (S); `synchronized` (S)

#### 8.5 Collect Detailed Audit Logs (PDF p.83) — **corrected**

- Removed: `configure detailed audit logging` (G); `forensic investigation` (C); `log management tool` (I); `log management policy/process` (I); `potentially OS dependent` (I)

- Added: `Configure` (G); `Detailed Audit Logs` (C); `Could Assist in a Forensic Investigation` (S)

- Kept: `enterprise assets containing sensitive data` (C); `event source` (S); `date` (S); `username` (S); `timestamp` (S); `source addresses` (S); `destination addresses` (S); `other useful elements` (S)

#### 8.6 Collect DNS Query Audit Logs (PDF p.84) — **corrected**

- Removed: `where appropriate and supported` (G); `collect DNS query audit logs` (C); `log management tool` (I); `secure configuration policy/process` (I); `potentially OS dependent` (I)

- Moved: `where appropriate` S→G; `where supported` S→G; `DNS query logs` S→C; `enterprise assets` C→S

- Added: `Collect` (G)

#### 8.7 Collect URL Request Audit Logs (PDF p.85) — **corrected**

- Removed: `where appropriate and supported` (G); `collect URL request audit logs` (C); `log management tool` (I); `secure configuration policy/process` (I); `potentially OS dependent` (I)

- Moved: `where appropriate` S→G; `where supported` S→G; `URL request audit logs` S→C; `enterprise assets` C→S

- Added: `Collect` (G)

#### 8.8 Collect Command-Line Audit Logs (PDF p.86) — **corrected**

- Removed: `collect command-line audit logs` (G); `BASH` (S); `log management tool` (I); `secure configuration policy/process` (I); `OS dependent` (I)

- Moved: `PowerShell` S→I; `remote administrative terminals` S→I

- Added: `Collect` (G); `Collecting Audit Logs From:` (I); `BASHTM` (I)

- Kept: `command-line audit logs` (C)

#### 8.9 Centralize Audit Logs (PDF p.87) — **corrected**

- Removed: `centralize audit log collection and retention` (C); `SIEM tool` (I); `log analytics and centralization tool` (I); `OS dependent` (I)

- Moved: `audit log collection` S→C; `audit log retention` S→C; `enterprise assets` C→S; `in accordance with documented audit log management process` G→S

- Added: `Centralize` (G); `Leveraging a SIEM tool to centralize multiple log sources` (I)

- Kept: `to the extent possible` (G)

#### 8.10 Retain Audit Logs (PDF p.88) — **corrected**

- Removed: `retain audit logs` (C); `log analytics and centralization tool` (I)

- Moved: `enterprise assets` C→S

- Added: `Retain` (G); `Audit Logs` (C)

- Kept: `minimum of 90 days` (G)

#### 8.11 Conduct Audit Log Reviews (PDF p.89) — **corrected**

- Removed: `conduct reviews on a weekly, or more frequent, basis` (G); `detect anomalies or abnormal events` (C); `potential threat` (C); `log analytics and centralization tool` (I)

- Moved: `weekly` S→G; `more frequent` S→G

- Added: `Conduct Reviews` (G); `Review Audit Logs` (C); `Could Indicate a potential threat` (S)

- Kept: `anomalies` (S); `abnormal events` (S)

#### 8.12 Collect Service Provider Logs (PDF p.90) — **corrected**

- Removed: `collect service provider logs` (C); `authentication events` (S); `authorization events` (S); `log analytics and centralization tool` (I); `secure configuration policy/process` (I)

- Moved: `data creation events` S→I; `disposal events` S→I; `user management events` S→I

- Added: `Collect` (G); `Service provider logs` (C); `Collecting authentication events` (I); `Collecting authorization events` (I)

- Kept: `where supported` (G)

#### 9.1 Ensure Use of Only Fully Supported Browsers and Email Clients (PDF p.92) — **corrected**

- Removed: `ensure only fully supported browsers and email clients are allowed to execute` (G); `fully supported browsers only` (C); `fully supported email clients only` (C); `latest vendor versions only` (C); `execution restriction enforcement` (C); `ensure only fully supported` (S); `browsers and email clients` (S); `are allowed to execute` (S); `in the enterprise` (S); `only using the latest version` (S); `provided through the vendor` (S); `enterprise and software asset management tools` (I); `application allowlisting` (I); `software inventory systems` (I); `automated patch management` (I)

- Added: `Ensure` (G); `Only Fully Supported` (C); `Browsers` (C); `Email Clients` (C); `Allowed to execute` (S)

- Kept: `only using the latest version provided through the vendor` (G)

#### 9.2 Use DNS Filtering Services (PDF p.93) — **corrected**

- Removed: `use DNS filtering services on all end-user devices` (G); `including remote and on-premise assets` (G); `to block access to known malicious domains` (G); `DNS filtering services deployment` (C); `all end-user device coverage` (C); `malicious domain blocking` (C); `remote and on-premise asset inclusion` (C); `use DNS filtering services` (S); `on all end-user devices` (S); `including remote assets` (S); `including on-premise assets` (S); `to block access` (S); `to known malicious domains` (S); `DNS filtering services` (I); `secure DNS servers` (I); `DNS security platforms` (I); `cloud-based DNS filtering` (I)

- Added: `Use` (G); `DNS Filtering Service` (C); `All End-user devices` (S); `Remote assets` (S); `On-premise assets` (S); `Block Access to Known Malicious Domains` (S)

#### 9.3 Maintain and Enforce Network-Based URL Filters (PDF p.94) — **corrected**

- Removed: `enforce and update network-based URL filters` (G); `to limit enterprise asset from connecting to potentially malicious or unapproved websites` (G); `enforce filters for all enterprise assets` (G); `enterprise asset connection limiting` (C); `malicious website blocking` (C); `unapproved website blocking` (C); `enforce network-based URL filters` (S); `update network-based URL filters` (S); `limit enterprise asset from connecting` (S); `to potentially malicious websites` (S); `to unapproved websites` (S); `enforce filters for all enterprise assets` (S); `URL filtering tools` (I); `category-based filtering` (I); `web content filtering` (I)

- Added: `Enforce` (G); `Update` (G); `Enforce Filters` (G); `Limit enterprise Asset from connecting to` (S); `Unapproved Websites` (S); `Potentially Malicious Websites` (S); `Category based methods` (I)

- Kept: `network-based URL filters` (C); `block lists` (I); `reputation-based filtering` (I)

#### 9.4 Restrict Unnecessary or Unauthorized Browser and Email Client Extensions (PDF p.95) — **corrected**

- Removed: `restrict unauthorized or unnecessary browser or email client plugins, extensions, and add-on applications` (G); `either through uninstalling or disabling` (G); `browser plugin restrictions` (C); `email client plugin restrictions` (C); `browser extension restrictions` (C); `add-on application restrictions` (C); `restrict through uninstalling or disabling` (S); `unauthorized browser plugins` (S); `unnecessary browser plugins` (S); `unauthorized email client plugins` (S); `unnecessary email client plugins` (S); `unauthorized browser extensions` (S); `unnecessary browser extensions` (S); `unauthorized add-on applications` (S); `unnecessary add-on applications` (S); `configuration management tools` (I); `browser management systems` (I); `application control policies` (I); `extension management platforms` (I)

- Added: `Restrict` (G); `Uninstalling` (C); `Disabling` (C); `Unauthorized` (C); `Unnecessary` (C); `Browser Client Plugins` (S); `Email Client Plugins` (S); `Browser Extensions` (S); `Browser / Email Client Add-on applications` (S)

#### 9.5 Implement DMARC (PDF p.96) — **corrected**

- Removed: `implement DMARC policy and verification` (G); `starting with implementing SPF and DKIM standards` (G); `DMARC policy implementation` (C); `DMARC verification implementation` (C); `SPF standard implementation` (C); `DKIM standard implementation` (C); `implement DMARC policy` (S); `implement DMARC verification` (S); `to lower the chance of spoofed emails` (S); `to lower the chance of modified emails` (S); `from valid domains` (S); `starting with implementing SPF` (S); `starting with implementing DKIM` (S); `Sender Policy Framework standards` (S); `DomainKeys Identified Mail standards` (S); `DMARC management tools` (I); `email authentication services` (I); `SPF record management` (I); `DKIM signature management` (I)

- Moved: `to lower the chance of spoofed or modified emails from valid domains` G→S

- Added: `Implement` (G); `Implement Verification` (G); `Standards` (G); `DMARC policy` (C); `Sender Policy Framework (SPF)` (S); `DomainKeys Identified Mail (DKIM)` (S)

#### 9.6 Block Unnecessary File Types (PDF p.97) — **corrected**

- Removed: `block unnecessary file types attempting to enter the enterprise's email gateway` (G); `unnecessary file type blocking` (C); `email gateway protection` (C); `file type filtering` (C); `block unnecessary file types` (S); `attempting to enter` (S); `the enterprise's email gateway` (S); `email security tools` (I); `email gateway filtering` (I); `file type blocking systems` (I); `email content filtering` (I)

- Added: `Block` (G); `Unnecessary file types` (C); `At the Email Gateway` (C)

#### 9.7 Deploy and Maintain Email Server Anti-Malware Protections (PDF p.98) — **corrected**

- Removed: `deploy and maintain email server anti-malware protections` (G); `such as attachment scanning and/or sandboxing` (G); `attachment scanning capabilities` (C); `sandboxing capabilities` (C); `deployment and maintenance` (C); `deploy email server anti-malware protections` (S); `maintain email server anti-malware protections` (S); `such as attachment scanning` (S); `such as sandboxing` (S); `attachment scanning and/or sandboxing` (S); `email security tools` (I); `anti-malware platforms` (I); `attachment scanning systems` (I); `email sandboxing solutions` (I)

- Added: `Deploy` (G); `Maintain` (G); `Attachment Scanning` (I); `Sandboxing` (I)

- Kept: `email server anti-malware protections` (C)

#### 10.1 Deploy and Maintain Anti-Malware Software (PDF p.100) — **corrected**

- Removed: `deploy anti-malware software` (G); `maintain anti-malware software` (G); `all enterprise assets coverage` (G); `anti-malware software management` (G); `anti-malware software deployment` (C); `anti-malware software maintenance` (C); `enterprise assets protection` (C); `malware detection capabilities` (C); `endpoint protection platforms` (I); `anti-virus solutions` (I); `endpoint detection and response` (I); `malware protection tools` (I); `security software management` (I)

- Moved: `deploy` S→G; `maintain` S→G; `anti-malware software` S→C

- Kept: `all enterprise assets` (S)

#### 10.2 Configure Automatic Anti-Malware Signature Updates (PDF p.101) — **corrected**

- Removed: `configure automatic updates` (G); `all enterprise assets coverage` (G); `signature update management` (G); `automatic updates configuration` (C); `enterprise assets coverage` (C); `anti-malware software can auto update potentially` (I)

- Moved: `configure` S→G; `automatic updates` S→C; `anti-malware signature files` G→C

- Kept: `all enterprise assets` (S)

#### 10.3 Disable Autorun and Autoplay for Removable Media (PDF p.102) — **corrected**

- Removed: `disable autorun functionality` (G); `disable autoplay functionality` (G); `auto-execute prevention` (G); `removable media security` (G); `autorun disabling` (C); `autoplay disabling` (C); `auto-execute prevention` (C); `removable media protection` (C); `autorun` (S); `auto-execute functionality` (S); `group policy settings` (I); `registry modifications` (I); `configuration management tools` (I); `secure configuration policy/process` (I)

- Moved: `disable` S→G; `autoplay` S→C

- Added: `Auto Run` (C); `Auto-execute` (C)

- Kept: `removable media` (S)

#### 10.4 Configure Automatic Anti-Malware Scanning of Removable Media (PDF p.103) — **corrected**

- Removed: `configure anti-malware software` (G); `automatic scanning configuration` (G); `removable media scanning` (G); `scanning policy management` (G); `anti-malware software configuration` (C); `automatic scanning` (C); `removable media protection` (C); `malware detection on media` (C); `anti-malware software configuration policy/process` (I); `endpoint scanning policies` (I); `media scanning tools` (I); `automated threat detection` (I)

- Moved: `configure` S→G; `anti-malware software` S→C; `automatically scan` S→C

- Kept: `removable media` (S)

#### 10.5 Enable Anti-Exploitation Features (PDF p.104) — **corrected**

- Removed: `enable anti-exploitation features` (G); `enterprise assets coverage` (G); `software protection` (G); `where possible implementation` (G); `enterprise assets protection` (C); `software security` (C); `exploit prevention` (C); `Gatekeeper™` (I); `configuration management tool` (I)

- Moved: `enable` S→G; `where possible` S→G

- Added: `GatekeeperTM` (I)

- Kept: `anti-exploitation features` (C); `enterprise assets` (S); `software` (S); `Microsoft® Data Execution Prevention (DEP)` (I); `Windows® Defender Exploit Guard (WDEG)` (I); `Apple® System Integrity Protection (SIP)` (I)

#### 10.6 Centrally Manage Anti-Malware Software (PDF p.105) — **corrected**

- Removed: `centrally manage anti-malware` (G); `centralized management process` (G); `anti-malware software governance` (G); `management infrastructure` (G); `centralized management` (C); `management capabilities` (C); `centralized control` (C); `anti-malware software configuration policy/process` (I); `centralized management platforms` (I); `security management consoles` (I); `enterprise security tools` (I)

- Moved: `centrally manage` S→G

- Kept: `anti-malware software` (C)

#### 10.7 Use Behavior-Based Anti-Malware Software (PDF p.106) — **corrected**

- Removed: `use behavior-based anti-malware` (G); `behavioral analysis implementation` (G); `advanced threat detection` (G); `behavior-based protection` (G); `behavior-based anti-malware software` (C); `behavioral analysis` (C); `advanced malware detection` (C); `dynamic threat identification` (C); `anti-malware software configuration policy/process` (I); `behavioral analysis tools` (I); `advanced endpoint detection` (I); `machine learning security` (I)

- Moved: `use` S→G; `anti-malware software` S→C; `behavior-based` S→C

#### 11.1 Establish and Maintain a Data Recovery Process (PDF p.108) — **corrected**

- Removed: `establish documented data recovery process` (G); `maintain documented data recovery process` (G); `review and update documentation annually` (G); `when significant enterprise changes occur` (S); `data recovery policy/process` (I); `business continuity documentation` (I); `recovery procedures manual` (I); `backup and recovery strategy` (I)

- Moved: `establish` S→G; `maintain` S→G; `review and update documentation` S→G; `annually` S→G; `scope of data recovery activities` C→S; `recovery prioritization` C→S; `security of backup data` C→S

- Kept: `when significant enterprise changes occur that could impact this Safeguard` (G); `documented data recovery process` (C)

#### 11.2 Perform Automated Backups (PDF p.109) — **corrected**

- Removed: `perform automated backups` (G); `in-scope enterprise assets` (G); `run backups weekly or more frequently` (G); `based on sensitivity of data` (G); `automated backups` (C); `in-scope enterprise assets` (C); `backup frequency requirements` (C); `data sensitivity considerations` (C); `automated backups` (S); `in-scope enterprise assets` (S); `based on sensitivity of the data` (S); `data backup and recovery tool` (I); `automated backup systems` (I); `backup scheduling software` (I); `enterprise backup solutions` (I)

- Moved: `perform` S→G; `run backups` S→G; `weekly` S→G; `more frequently` S→G

- Added: `Based on Sensitivity` (G); `Scope` (S); `Enterprise Assets` (S)

#### 11.3 Protect Recovery Data (PDF p.110) — **corrected**

- Removed: `protect recovery data` (G); `reference encryption or data separation` (G); `recovery data protection` (C); `equivalent controls` (C); `original data protection parity` (C); `requirements-based implementation` (C); `data backup and recovery tool` (I); `backup encryption systems` (I); `secure backup storage` (I); `data separation technologies` (I)

- Moved: `protect` S→G; `reference encryption` S→G; `data separation` S→G; `recovery data` S→C; `equivalent controls to original data` G→S

- Kept: `based on requirements` (G)

#### 11.4 Establish and Maintain an Isolated Instance of Recovery Data (PDF p.111) — **corrected**

- Removed: `establish isolated instance of recovery data` (G); `maintain isolated instance of recovery data` (G); `example implementations include offline, cloud, or off-site systems or services` (G); `backup destination control` (C); `recovery data isolation` (C); `implementation flexibility` (C); `data backup and recovery tool` (I); `offline backup systems` (I); `cloud backup services` (I); `off-site storage solutions` (I)

- Moved: `establish` S→G; `maintain` S→G; `version controlling backup destinations` G→I; `offline` S→I; `cloud` S→I; `off-site systems` S→I; `services` S→I

- Kept: `isolated instance of recovery data` (C)

#### 11.5 Test Data Recovery (PDF p.112) — **corrected**

- Removed: `test backup recovery quarterly or more frequently` (G); `sampling of in-scope enterprise assets` (G); `recovery testing requirements` (G); `testing frequency management` (G); `backup recovery testing` (C); `quarterly testing frequency` (C); `in-scope enterprise assets sampling` (C); `recovery validation` (C); `in-scope enterprise assets` (S); `data recovery policy/process` (I); `data backup and recovery tool` (I); `recovery testing procedures` (I); `backup validation systems` (I)

- Moved: `quarterly` S→G; `more frequently` S→G; `test backup recovery` S→C

- Added: `In-Scope` (S); `Enterprise Assets` (S)

- Kept: `sampling` (S)

#### 12.1 Ensure Network Infrastructure is Up-to-Date (PDF p.114) — **corrected**

- Removed: `ensure network infrastructure is kept up-to-date` (G); `review software versions monthly or more frequently` (G); `verify software support` (G); `network infrastructure maintenance` (G); `network infrastructure up-to-date` (C); `latest stable release of software` (C); `currently supported network-as-a-service offerings` (C); `software version review` (C); `review software versions` (S); `verify software support` (S); `enterprise and software asset management tool` (I); `network management systems` (I); `automated patching tools` (I); `network-as-a-service platforms` (I)

- Moved: `ensure` S→G; `monthly` S→G; `more frequently` S→G; `network infrastructure is kept up-to-date` S→C; `running the latest stable release of software` S→I; `using currently supported network-as-a-service (NaaS) offerings` S→I

- Added: `Review software versions to verify software support` (G)

#### 12.2 Establish and Maintain a Secure Network Architecture (PDF p.115) — **corrected**

- Removed: `design secure network architecture` (G); `maintain secure network architecture` (G); `must address segmentation, least privilege, and availability at minimum` (G); `secure network architecture requirements` (G); `least privilege (POLP)` (C); `least privilege` (S); `at a minimum` (S); `secure network management and design policy/process` (I); `network architecture tools` (I)

- Moved: `design` S→G; `maintain` S→G; `must address` S→G; `segmentation` C→S; `availability` C→S

- Added: `Minimum` (G); `POLP - Least Privilege` (S)

- Kept: `secure network architecture` (C); `documentation` (I); `policy` (I); `design components` (I)

#### 12.3 Securely Manage Network Infrastructure (PDF p.116) — **corrected**

- Removed: `securely manage network infrastructure` (G); `secure network protocols usage` (G); `infrastructure security management` (G); `secure management practices` (G); `secure network protocols` (C); `infrastructure security` (C); `securely manage` (S); `network infrastructure` (S); `use of secure network protocols` (S); `secure network management and design policy/process` (I); `infrastructure-as-code platforms` (I); `secure protocol implementations` (I)

- Moved: `version-controlled infrastructure-as-code` C→I; `SSH` S→I; `HTTPS` S→I

- Added: `Use of Secure Protocols` (I)

- Kept: `secure network management` (C); `network management and monitoring tool` (I)

#### 12.4 Establish and Maintain Architecture Diagram(s) (PDF p.117) — **corrected**

- Removed: `establish architecture diagrams` (G); `maintain architecture diagrams` (G); `review and update documentation annually` (G); `architecture diagrams` (C); `documentation review and updates` (C); `enterprise change management` (C); `architecture diagrams` (S); `other network system documentation` (S); `when significant enterprise changes occur` (S); `secure network management and design policy/process` (I); `documentation management systems` (I); `architecture visualization tools` (I)

- Moved: `establish` S→G; `maintain` S→G; `review and update documentation` S→G; `annually` S→G

- Added: `Architecture Diagram(s)` (C)

- Kept: `when significant enterprise changes occur that could impact this Safeguard` (G); `network system documentation` (C); `network architecture diagramming tool` (I)

#### 12.5 Centralize Network Authentication, Authorization, and Auditing (AAA) (PDF p.118) — **corrected**

- Removed: `centralize network AAA` (G); `network authentication centralization` (G); `network authorization centralization` (G); `network auditing centralization` (G); `network AAA centralization` (C); `secure network management and design policy/process` (I); `identity and access management tool` (I); `AAA servers` (I); `centralized authentication systems` (I)

- Moved: `centralize` S→G; `network AAA` S→C; `authentication` C→S; `authorization` C→S; `auditing` C→S

#### 12.6 Use of Secure Network Management and Communication Protocols (PDF p.119) — **corrected**

- Removed: `use secure network management protocols` (G); `use secure communication protocols` (G); `secure protocol implementation` (G); `enterprise-grade security protocols` (G); `802.1X implementation` (C); `WPA2 Enterprise or greater` (C); `communication protocols` (S); `Wi-Fi Protected Access 2 (WPA2) Enterprise` (S); `secure network management and design policy/process` (I); `802.1X authentication systems` (I); `enterprise wireless controllers` (I); `secure protocol implementations` (I)

- Moved: `use` S→G; `greater` S→G; `802.1X` S→I

- Added: `WPA2 Enterprise` (I)

- Kept: `secure network management` (C); `secure communication protocols` (C)

#### 12.7 Ensure Remote Devices Utilize a VPN and are Connecting to an Enterprise’s AAA Infrastructure (PDF p.120) — **corrected**

- Removed: `require users to authenticate to enterprise-managed VPN` (G); `authenticate to authentication services` (G); `VPN and AAA integration requirements` (G); `user authentication requirements` (C); `enterprise resource access control` (C); `users to authenticate` (S); `prior to accessing enterprise resources` (S); `end-user devices` (S); `secure network management and design policy/process` (I); `VPN/encryption tool` (I); `enterprise VPN solutions` (I); `AAA integration systems` (I)

- Moved: `require` S→G

- Added: `Users Required to Authenticate` (C)

- Kept: `prior to accessing enterprise resources on end-user devices` (G); `enterprise-managed VPN` (C); `authentication services` (C)

#### 12.8 Establish and Maintain Dedicated Computing Resources for All Administrative Work (PDF p.121) — **corrected**

- Removed: `establish dedicated computing resources for administrative work` (G); `maintain dedicated computing resources` (G); `segmented from enterprise's primary network` (G); `not allowed internet access` (G); `administrative tasks isolation` (C); `administrative access separation` (C); `network segmentation from primary network` (C); `dedicated computing resources` (S); `physically or logically separated` (S); `all administrative tasks` (S); `no internet access` (S); `secure network management and design policy/process` (I); `secure admin workstations (SAW)` (I); `network segmentation tools` (I); `administrative isolation systems` (I)

- Moved: `establish` S→G; `maintain` S→G; `tasks requiring administrative access` S→C

- Added: `For all administrative tasks` (C); `No Internet` (S); `Physically` (S); `Logically` (S)

- Kept: `dedicated computing resources (SAW)` (C); `segmented from primary network` (S)

#### 13.1 Centralize Security Event Alerting (PDF p.123) — **corrected**

- Removed: `centralize security event alerting across enterprise assets` (G); `log correlation and analysis` (G); `active exploitation attempts monitoring` (G); `centralized security event alerting` (C); `log correlation capabilities` (C); `analysis of security events` (C); `active exploitation attempt detection` (C); `centralize security event alerting` (S); `across enterprise assets` (S); `for log correlation` (S); `for analysis` (S); `active exploitation attempts` (S); `of enterprise assets` (S); `security information and event management (SIEM)` (I); `security orchestration, automation and response (SOAR)` (I); `log aggregation platforms` (I); `event correlation engines` (I)

- Added: `Centralize` (G); `Security Event Alerting` (C); `Log Correlation` (S); `Analysis` (S); `Enterprise Assets` (S); `SIEM` (I); `Log Analytics Platform` (I); `Vendor-defined Event Correlation Alerts` (I); `Security-relevant correlation alerts` (I)

#### 13.2 Deploy a Host-Based Intrusion Detection Solution (PDF p.124) — **corrected**

- Removed: `deploy host-based intrusion detection solution` (G); `on enterprise assets` (G); `where technically feasible` (G); `deployment on enterprise assets` (C); `technical feasibility assessment` (C); `on enterprise assets` (S); `where technically feasible` (S); `host-based intrusion detection systems (HIDS)` (I); `endpoint detection and response (EDR)` (I); `host-based security monitoring` (I); `behavioral analysis tools` (I)

- Moved: `deploy` S→G

- Added: `Where appropriate` (G); `Where supported` (G); `Enterprise Assets` (S)

- Kept: `host-based intrusion detection solution` (C)

#### 13.3 Deploy a Network Intrusion Detection Solution (PDF p.125) — **corrected**

- Removed: `deploy network intrusion detection solution` (G); `ruleset tuned for threats facing enterprise's industry sector` (G); `threat-tuned rulesets` (C); `industry-specific threat focus` (C); `with ruleset tuned` (S); `for threats facing` (S); `the enterprise's industry sector` (S); `network intrusion detection systems (NIDS)` (I); `network security monitoring` (I); `threat intelligence integration` (I); `industry-specific threat feeds` (I)

- Moved: `deploy` S→G

- Added: `Where Appropriate` (G); `Enterprise Assets` (S); `Network Intrusion Detection System (NIDS)` (I); `Equivalent CSP Service` (I)

- Kept: `network intrusion detection solution` (C)

#### 13.4 Perform Traffic Filtering Between Network Segments (PDF p.126) — **corrected**

- Removed: `perform traffic filtering between network segments` (G); `where technically feasible` (G); `network segmentation controls` (C); `technical feasibility assessment` (C); `perform traffic filtering` (S); `between network segments` (S); `where technically feasible` (S); `network firewalls` (I); `micro-segmentation` (I); `network access control` (I); `software-defined perimeter` (I)

- Added: `Perform` (G); `Where Appropriate` (G)

- Kept: `traffic filtering between network segments` (C)

#### 13.5 Manage Access Control for Remote Assets (PDF p.127) — **corrected**

- Removed: `manage access control for assets remotely connecting to enterprise resources` (G); `determine amount of access based on security posture` (G); `access control for remote assets` (C); `remote connection management` (C); `security posture-based access` (C); `manage access control` (S); `for assets remotely connecting` (S); `to enterprise resources` (S); `determine amount of access` (S); `up-to-date anti-malware software installed` (S); `configuration compliance with the enterprise's secure configuration process` (S); `operating system and applications are up-to-date` (S); `network access control (NAC)` (I); `zero trust network access` (I); `device compliance checking` (I); `posture assessment tools` (I)

- Added: `Manage` (G); `Access Control` (C); `Remote Assets` (C); `Connecting to Enterprise Resources` (S); `Determine Amount of access Based on:` (S); `Anti Malware Software Installed` (S); `Up to date Anti Malware Signatures / Version` (S); `Up to Date OS` (S); `Up to date Applications` (S); `Compliant with Configuration Process` (S)

#### 13.6 Collect Network Traffic Flow Logs (PDF p.128) — **corrected**

- Removed: `collect network traffic flow logs and/or network traffic` (G); `to review and alert upon` (G); `network traffic flow log collection` (C); `network traffic monitoring` (C); `review and alerting capabilities` (C); `collect network traffic flow logs` (S); `collect network traffic` (S); `to review` (S); `to alert upon` (S); `network flow analyzers` (I); `packet capture systems` (I); `network monitoring tools` (I); `traffic analysis platforms` (I)

- Added: `Collect` (G); `Network Traffic Flow logs` (C); `Network Traffic` (C); `Network Devices` (S); `Review` (S); `Alert` (S)

#### 13.7 Deploy a Host-Based Intrusion Prevention Solution (PDF p.129) — **corrected**

- Removed: `deploy host-based intrusion prevention solution` (G); `on enterprise assets` (G); `where technically feasible` (G); `host-based intrusion prevention solution` (C); `deployment on enterprise assets` (C); `technical feasibility assessment` (C); `host-based intrusion prevention solution` (S); `on enterprise assets` (S); `where technically feasible` (S); `host-based intrusion prevention systems (HIPS)` (I); `endpoint protection platforms` (I); `behavioral blocking systems` (I); `automated threat response` (I)

- Moved: `deploy` S→G

- Added: `Where appropriate` (G); `Where supported` (G); `Host-based Intrusion Prevention Solution (IPS)` (C); `Enterprise Assets` (S); `EDR` (I); `Host Based IPS Agent` (I)

#### 13.8 Deploy a Network Intrusion Prevention Solution (PDF p.130) — **corrected**

- Removed: `deploy network intrusion prevention solution` (G); `to block malicious network traffic in real-time` (G); `malicious traffic blocking` (C); `real-time response capabilities` (C); `to block malicious network traffic` (S); `in real-time` (S); `network intrusion prevention systems (NIPS)` (I); `inline security appliances` (I); `automated blocking systems` (I); `real-time threat mitigation` (I)

- Moved: `deploy` S→G

- Added: `Where Appropriate` (G)

- Kept: `network intrusion prevention solution` (C)

#### 13.9 Deploy Port-Level Access Control (PDF p.131) — **corrected**

- Removed: `deploy port-level access control` (G); `utilizes 802.1x or similar network access control protocols` (G); `802.1x implementation` (C); `network access control protocols` (C); `deploy port-level access control` (S); `utilizes 802.1x` (S); `such as certificates` (S); `802.1x authentication` (I); `network access control systems` (I); `certificate-based authentication` (I); `port-based network access control` (I)

- Added: `Deploy` (G); `802.1x` (S); `User Authentication` (S); `Device Authentication` (S); `Certificate Based` (I)

- Kept: `port-level access control` (C); `similar network access control protocols` (S)

#### 13.10 Perform Application Layer Filtering (PDF p.132) — **corrected**

- Removed: `perform application layer filtering` (G); `to protect against enterprise's most common network-based attacks` (G); `protection against common network-based attacks` (C); `enterprise-specific threat focus` (C); `perform application layer filtering` (S); `to protect against` (S); `the enterprise's most common` (S); `network-based attacks` (S); `web application firewalls` (I); `application layer gateways` (I); `deep packet inspection` (I); `application-aware filtering` (I)

- Added: `Perform` (G); `Filtering Proxy` (I); `Application Layer Firewall` (I); `Gateway` (I)

- Kept: `application layer filtering` (C)

#### 13.11 Tune Security Event Alerting Thresholds (PDF p.133) — **corrected**

- Removed: `tune security event alerting thresholds` (G); `monthly or more frequently` (G); `security event alerting threshold tuning` (C); `monthly tuning frequency` (C); `threshold optimization` (C); `tune security event alerting thresholds` (S); `or more frequently` (S); `SIEM tuning processes` (I); `threshold optimization tools` (I); `alert management platforms` (I); `false positive reduction` (I)

- Moved: `monthly` S→G

- Added: `Tune Alerts` (G); `More Frequently` (G)

#### 14.1 Establish and Maintain a Security Awareness Program (PDF p.135) — **corrected**

- Removed: `establish and maintain a security awareness program` (G); `conduct training at hire and at a minimum annually` (G); `review and update content annually or when significant enterprise changes occur` (G); `security awareness program establishment` (C); `workforce education on secure interaction` (C); `enterprise assets and data security training` (C); `training frequency requirements` (C); `establish security awareness program` (S); `maintain security awareness program` (S); `educate enterprise workforce` (S); `how to interact with enterprise assets` (S); `how to interact with data in secure manner` (S); `conduct training minimum annually` (S); `review and update content annually` (S); `when significant enterprise changes occur` (S); `security training and awareness tools` (I); `security training and awareness policy/process` (I); `training documentation systems` (I); `learning management systems` (I)

- Moved: `conduct training at hire` S→G

- Added: `Establish` (G); `Maintain` (G); `Minimum, annually` (G); `Review and update Content` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Security Awareness program` (C); `Educate the enterprise’s workforce on how to interact in a secure manner` (C); `Enterprise Assets` (S); `Data` (S)

#### 14.2 Train Workforce Members to Recognize Social Engineering Attacks (PDF p.136) — **corrected**

- Removed: `train workforce members to recognize social engineering attacks` (G); `such as phishing, business email compromise, pretexting, and tailgating` (G); `workforce training on social engineering recognition` (C); `phishing attack awareness` (C); `business email compromise awareness` (C); `pretexting attack awareness` (C); `tailgating attack awareness` (C); `train workforce members` (S); `to recognize social engineering attacks` (S); `such as phishing` (S); `such as business email compromise (BEC)` (S); `such as pretexting` (S); `such as tailgating` (S); `security training and awareness tools` (I); `phishing simulation platforms` (I); `social engineering awareness training` (I); `security awareness modules` (I)

- Added: `Train workforce to recognize Social Engineering Attacks` (C); `Phishing` (I); `Business Email Compromise (BEC)` (I)

#### 14.3 Train Workforce Members on Authentication Best Practices (PDF p.137) — **corrected**

- Removed: `train workforce members on authentication best practices` (G); `example topics include MFA, password composition, and credential management` (G); `authentication best practices training` (C); `MFA training` (C); `password composition training` (C); `credential management training` (C); `train workforce members` (S); `on authentication best practices` (S); `example topics include MFA` (S); `example topics include password composition` (S); `example topics include credential management` (S); `security training and awareness tools` (I); `authentication training modules` (I); `password security training` (I); `MFA awareness programs` (I)

- Added: `Train workforce on Authentication Best Practices` (C); `MFA` (I); `Password Composition` (I); `Credential Management` (I)

#### 14.4 Train Workforce on Data Handling Best Practices (PDF p.138) — **corrected**

- Removed: `train workforce members on how to identify and properly store, transfer, archive, and destroy sensitive data` (G); `training on clear screen and desk best practices` (G); `such as locking screen when stepping away, erasing whiteboards, storing data securely` (G); `data handling best practices training` (C); `sensitive data identification training` (C); `secure data storage, transfer, archive, destroy procedures` (C); `clear screen and desk policies` (C); `identify sensitive data` (S); `properly store sensitive data` (S); `properly transfer sensitive data` (S); `properly archive sensitive data` (S); `properly destroy sensitive data` (S); `clear screen best practices` (S); `clear desk best practices` (S); `locking screen when stepping away` (S); `erasing physical whiteboards at end of meetings` (S); `erasing virtual whiteboards at end of meetings` (S); `storing data and assets securely` (S); `security training and awareness tools` (I); `data handling training modules` (I); `clean desk policy training` (I); `data classification training` (I)

- Moved: `train workforce members on how to` S→C

- Added: `Identify` (C); `Transfer` (C); `Archive` (C); `Destroy` (C); `Properly Store` (C); `Sensitive Data` (C); `Clear Screen` (S); `Clear Desk` (S); `Locking their screen when they step away from their enterprise asset` (I); `Erase physical Whiteboards after meetings` (I); `Erase virtual Whiteboards after meetings` (I); `Storing Data Securely` (I); `Storing Assets Securely` (I)

#### 14.5 Train Workforce Members on Causes of Unintentional Data Exposure (PDF p.139) — **corrected**

- Removed: `example topics include mis-delivery, losing portable devices, publishing to unintended audiences` (G); `unintentional data exposure awareness training` (C); `mis-delivery prevention training` (C); `portable device security awareness` (C); `data publication controls training` (C); `train workforce members` (S); `to be aware of causes for unintentional data exposure` (S); `example topics include mis-delivery of sensitive data` (S); `example topics include losing a portable end-user device` (S); `example topics include publishing data to unintended audiences` (S); `security training and awareness tools` (I); `data loss prevention training` (I); `device security awareness training` (I); `data sharing awareness programs` (I)

- Moved: `train workforce members to be aware of causes for unintentional data exposure` G→C

- Added: `Mis-Delivery of Sensitive Data` (I); `Losing a Portable End user Device` (I); `Publishing data to unintended Audiences` (I)

#### 14.6 Train Workforce Members on Recognizing and Reporting Security Incidents (PDF p.140) — **corrected**

- Removed: `train workforce members to be able to recognize a potential incident` (G); `train workforce members to be able to report such an incident` (G); `security incident recognition training` (C); `incident reporting training` (C); `potential incident identification` (C); `incident reporting procedures` (C); `to be able to recognize a potential incident` (S); `to be able to report such an incident` (S); `security training and awareness tools` (I); `incident response training` (I); `security incident awareness programs` (I); `incident reporting tools` (I)

- Moved: `train workforce members` S→C

- Added: `Be able to` (G); `Recognize a potential Security Incident` (C); `Report such an incident` (C)

#### 14.7 Train Workforce on How to Identify and Report if Their Enterprise Assets are Missing Security Updates (PDF p.141) — **corrected**

- Removed: `train workforce to understand how to verify and report out-of-date software patches` (G); `train on reporting failures in automated processes and tools` (G); `include notifying IT personnel of any failures in automated processes and tools` (G); `security update verification training` (C); `out-of-date software patch identification` (C); `automated process failure reporting` (C); `IT personnel notification procedures` (C); `train workforce to understand how to` (S); `verify out-of-date software patches` (S); `report out-of-date software patches` (S); `report any failures in automated processes` (S); `report any failures in automated tools` (S); `training should include notifying IT personnel` (S); `of any failures in automated processes` (S); `of any failures in automated tools` (S); `security training and awareness tools` (I); `patch management awareness training` (I); `IT support reporting procedures` (I); `automated system monitoring training` (I)

- Added: `Train Workforce members on how to` (C); `Verify` (C); `Report` (C); `out-of-date software patches` (C); `Any failures in automated processes` (C); `Any failures in automated tools` (C); `Training Should Include` (S); `Notifying IT personnel of any failures in automated processes` (S); `Notifying IT personnel of any failures in automated tools` (S)

#### 14.8 Train Workforce on the Dangers of Connecting to and Transmitting Enterprise Data Over Insecure Networks (PDF p.142) — **corrected**

- Removed: `train workforce members on dangers of connecting to and transmitting data over insecure networks` (G); `if enterprise has remote workers, training must include guidance for secure home network configuration` (G); `insecure network dangers training` (C); `secure connection practices` (C); `enterprise data transmission security` (C); `remote worker home network security` (C); `train workforce members on the dangers of` (S); `for enterprise activities` (S); `if enterprise has remote workers` (S); `training must include guidance` (S); `to ensure all users securely configure` (S); `their home network infrastructure` (S); `security training and awareness tools` (I); `network security awareness training` (I); `remote work security training` (I); `home network configuration guides` (I)

- Moved: `connecting to insecure networks` S→C; `transmitting data over insecure networks` S→C

- Added: `Must Include` (G); `Train workforce members on` (C); `The dangers of` (C); `Guidance to ensure that all users securely configure their home network infrastructure` (C); `Remote Workers` (S); `Enterprise Activities` (S)

#### 14.9 Conduct Role-Specific Security Awareness and Skills Training (PDF p.143) — **corrected**

- Removed: `conduct role-specific security awareness and skills training` (G); `example implementations include secure system administration courses, OWASP Top 10 training, and advanced social engineering training` (G); `role-specific security awareness training` (C); `role-specific skills training` (C); `IT professional system administration courses` (C); `developer OWASP Top 10 training` (C); `high-profile role advanced social engineering training` (C); `conduct role-specific security awareness training` (S); `conduct role-specific skills training` (S); `secure system administration courses for IT professionals` (S); `OWASP Top 10 vulnerability awareness and prevention training for web application developers` (S); `security training and awareness tools` (I); `role-based training programs` (I); `specialized security courses` (I); `professional development programs` (I)

- Moved: `advanced social engineering awareness training for high-profile roles` S→I

- Added: `Conduct` (G); `IT Professionals` (I); `Web Developers` (I); `High-profile roles` (I); `Secure system administration courses` (I); `OWASP® Top 10 vulnerability awareness and prevention training` (I)

#### 15.1 Establish and Maintain an Inventory of Service Providers (PDF p.145) — **corrected**

- Removed: `establish and maintain an inventory of service providers` (G); `list all known service providers, include classifications, designate enterprise contact` (G); `review and update inventory annually or when significant enterprise changes occur` (G); `service provider inventory establishment` (C); `comprehensive service provider listing` (C); `classification system implementation` (C); `enterprise contact designation` (C); `establish inventory of service providers` (S); `maintain inventory of service providers` (S); `include classifications` (S); `review and update the inventory annually` (S); `third-party risk management tools` (I); `service provider management platforms` (I); `vendor inventory systems` (I); `supplier relationship management tools` (I)

- Moved: `when significant enterprise changes occur that could impact this safeguard` S→G

- Added: `Establish` (G); `Maintain` (G); `Review and update Content` (G); `Annually` (G); `Inventory of Service Providers` (C); `Classification(s)` (S)

- Kept: `list all known service providers` (S); `designate an enterprise contact for each service provider` (S)

#### 15.2 Establish and Maintain a Service Provider Management Policy (PDF p.146) — **corrected**

- Removed: `establish and maintain a service provider management policy` (G); `ensure policy addresses classification, inventory, assessment, monitoring, and decommissioning` (G); `review and update policy annually or when significant enterprise changes occur` (G); `service provider management policy establishment` (C); `comprehensive policy coverage` (C); `classification processes` (C); `inventory management processes` (C); `assessment processes` (C); `monitoring processes` (C); `decommissioning processes` (C); `establish service provider management policy` (S); `maintain service provider management policy` (S); `ensure policy addresses classification` (S); `ensure policy addresses inventory` (S); `ensure policy addresses assessment` (S); `ensure policy addresses monitoring` (S); `ensure policy addresses decommissioning of service providers` (S); `review and update policy annually` (S); `service provider management policy documentation` (I); `third-party risk management frameworks` (I); `vendor management policy templates` (I); `supplier governance documentation` (I)

- Moved: `when significant enterprise changes occur that could impact this safeguard` S→G

- Added: `Establish` (G); `Maintain` (G); `Ensure the policy addresses` (G); `Review and update Content` (G); `Annually` (G); `Service Provider Management Policy` (C); `Classification(s)` (S); `Inventory` (S); `Assessment` (S); `Monitoring` (S); `Decommissioning of service providers` (S)

#### 15.3 Classify Service Providers (PDF p.147) — **corrected**

- Removed: `classify service providers` (G); `classification may include data sensitivity, data volume, availability requirements, applicable regulations, inherent risk, mitigated risk` (G); `update and review classifications annually or when significant enterprise changes occur` (G); `service provider classification system` (C); `risk-based classification criteria` (C); `data sensitivity classification` (C); `regulatory compliance classification` (C); `classify service providers` (S); `classification consideration may include one or more characteristics` (S); `such as data sensitivity` (S); `such as data volume` (S); `such as availability requirements` (S); `such as applicable regulations` (S); `such as inherent risk` (S); `such as mitigated risk` (S); `update and review classifications annually` (S); `service provider management policy` (I); `risk classification frameworks` (I); `data sensitivity classification schemes` (I); `regulatory compliance matrices` (I)

- Moved: `when significant enterprise changes occur that could impact this safeguard` S→G

- Added: `Update and Review Classifications` (G); `Classify` (G); `Annually` (G); `Service Providers` (C); `May Include` (I); `One Characteristic` (I); `More Characteristics` (I); `Data Sensitivity` (I); `Data volume` (I); `Availability requirements` (I); `Applicable regulations` (I); `Inherent Risk` (I); `Mitigated Risk` (I)

#### 15.4 Ensure Service Provider Contracts Include Security Requirements (PDF p.148) — **corrected**

- Removed: `ensure service provider contracts include security requirements` (G); `security requirements must be consistent with enterprise's service provider management policy` (G); `contract security requirements inclusion` (C); `security incident and data breach notification requirements` (C); `ensure service provider contracts include security requirements` (S); `example requirements may include minimum security program requirements` (S); `security requirements must be consistent with enterprise's service provider management policy` (S); `review service provider contracts annually` (S); `to ensure contracts are not missing security requirements` (S); `contract management systems` (I); `service provider management policy` (I); `legal contract templates` (I); `security requirement checklists` (I)

- Moved: `minimum security program requirements` C→I; `security incident and/or data breach notification and response` S→I; `data encryption requirements` C→I; `data disposal commitments` C→I

- Added: `Ensure` (G); `Must` (G); `Service provider contracts include security requirements` (C); `Include Security requirements Consistent with the enterprise's service provider management policy` (S); `Contract Management` (I)

- Kept: `review service provider contracts annually to ensure contracts are not missing security requirements` (G)

#### 15.5 Assess Service Providers (PDF p.149) — **corrected**

- Removed: `assess service providers consistent with enterprise's service provider management policy` (G); `assessment scope may vary based on classifications and may include SOC 2, PCI AoC, customized questionnaires, or other rigorous processes` (G); `reassess service providers annually at minimum or with new and renewed contracts` (G); `service provider assessment processes` (C); `standardized assessment report reviews` (C); `customized questionnaire assessments` (C); `rigorous assessment methodologies` (C); `assess service providers consistent with enterprise's service provider management policy` (S); `assessment scope may vary based on classifications` (S); `may include review of standardized assessment reports` (S); `such as Service Organization Control 2 (SOC 2)` (S); `Payment Card Industry (PCI) Attestation of Compliance (AoC)` (S); `customized questionnaires` (S); `reassess service providers annually at a minimum` (S); `or with new and renewed contracts` (S); `third-party risk management tools` (I); `service provider management policy` (I); `assessment questionnaire platforms` (I); `compliance monitoring systems` (I)

- Moved: `other appropriately rigorous processes` S→I

- Added: `Consistent with the enterprise's service provider management policy` (G); `Reassess service Providers` (G); `At a Minimum Annually` (G); `With new renewed contracts` (G); `Third-Party Risk Management Tool` (I); `Review of Standardized Assesments` (I); `PCI-DSS (AoC)` (I); `SOC2` (I); `Customized questionnaire` (I)

#### 15.6 Monitor Service Providers (PDF p.150) — **corrected**

- Removed: `monitor service providers consistent with enterprise's service provider management policy` (G); `monitoring may include periodic reassessment, release notes monitoring, and dark web monitoring` (G); `service provider monitoring processes` (C); `periodic compliance reassessment` (C); `service provider release notes monitoring` (C); `monitor service providers` (S); `monitoring may include periodic reassessment of service provider compliance` (S); `monitoring service provider release notes` (S); `third-party risk management tools` (I); `service provider management policy` (I); `dark web monitoring services` (I); `compliance monitoring platforms` (I)

- Moved: `consistent with enterprise's service provider management policy` S→G; `dark web monitoring` C→I

- Added: `Third-Party Risk Management Tool` (I); `Periodic reassessment of service provider compliance` (I); `Monitoring service provider notes` (I)

#### 15.7 Securely Decommission Service Providers (PDF p.151) — **corrected**

- Removed: `securely decommission service providers` (G); `example considerations include user and service account deactivation, termination of data flows, secure disposal of enterprise data` (G); `secure service provider decommissioning` (C); `data flow termination` (C); `secure enterprise data disposal` (C); `securely decommission service providers` (S); `example considerations include user and service account deactivation` (S); `service provider management policy` (I); `data destruction procedures` (I); `account deactivation processes` (I); `secure decommissioning checklists` (I)

- Moved: `user and service account deactivation` C→I; `termination of data flows` S→I; `secure disposal of enterprise data within service provider systems` S→I

#### 16.1 Establish and Maintain a Secure Application Development Process (PDF p.153) — **corrected**

- Removed: `establish and maintain a secure application development process` (G); `review and update documentation annually or when significant enterprise changes occur that could impact this safeguard` (G); `application security testing procedures` (C); `address such items as secure application design standards` (S); `address such items as secure coding practices` (S); `address such items as developer training` (S); `address such items as vulnerability management` (S); `address such items as security of third-party code` (S); `address such items as application security testing procedures` (S); `review and update documentation annually` (S); `when significant enterprise changes occur` (S); `secure development lifecycle (SDLC) frameworks` (I); `application security policies` (I); `development process documentation` (I); `security training programs for developers` (I)

- Moved: `secure application design standards` C→I; `secure coding practices` C→I; `developer training` C→I; `vulnerability management` C→I; `security of third-party code` C→I

- Added: `Establish` (G); `Maintain` (G); `Review and update documentation` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Application security testing procedure` (I)

- Kept: `secure application development process` (C)

#### 16.2 Establish and Maintain a Process to Accept and Address Software Vulnerabilities (PDF p.154) — **corrected**

- Removed: `establish and maintain a process to accept and address reports of software vulnerabilities` (G); `review and update documentation annually or when significant enterprise changes occur that could impact this safeguard` (G); `vulnerability handling policy` (C); `reporting process` (C); `process for intake, assignment, remediation, and remediation testing` (C); `vulnerability tracking system` (C); `metrics for measuring timing` (C); `process for assignment` (S); `process for remediation` (S); `process for remediation testing` (S); `vulnerability tracking system that includes severity ratings` (S); `metrics for measuring timing for identification of vulnerabilities` (S); `metrics for measuring timing for analysis of vulnerabilities` (S); `metrics for measuring timing for remediation of vulnerabilities` (S); `externally-facing policy that helps to set expectations for outside stakeholders` (S); `vulnerability disclosure platforms` (I); `bug bounty programs` (I); `vulnerability management systems` (I); `incident response tools` (I)

- Moved: `provide a means for external entities to report vulnerabilities` G→S; `severity ratings` C→S; `vulnerability handling policy that identifies reporting process` S→I; `responsible party for handling vulnerability reports` C→I; `process for intake` S→I

- Added: `Review and update documentation` (G); `Establish` (G); `Maintain` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Third Party Application Developer` (S); `Need to consider this an externally-facing policy that helps to set expectations for outside stakeholders` (S); `Vulnerability tracking system that includes` (S); `Metrics for measuring timing for` (S); `Identification of Vulnerabilities` (S); `Analysis of Vulnerabilities` (S); `Remediation of Vulnerabilites` (S); `Remediation` (S); `Assignment` (S); `Remediation testing` (S)

- Kept: `process to accept and address software vulnerabilities` (C)

#### 16.3 Perform Root Cause Analysis on Security Vulnerabilities (PDF p.155) — **corrected**

- Removed: `perform root cause analysis on security vulnerabilities` (G); `root cause analysis on security vulnerabilities` (C); `evaluating underlying issues that create vulnerabilities in code` (C); `when reviewing vulnerabilities` (S); `root cause analysis is the task of evaluating underlying issues` (S); `allows development teams to move beyond just fixing individual vulnerabilities as they arise` (S); `code analysis tools` (I); `vulnerability assessment platforms` (I); `development team training on root cause analysis` (I); `systematic vulnerability review processes` (I)

- Added: `Perform` (G); `Root Cause Analysis on Vulnerabilities` (C); `Reviewing vulnerabilites` (S); `Root cause analysis` (S); `Definition - "Task of evaluating underlying issues that create vulnerabilities in code, and allows development teams to move beyond just fixing individual vulnerabilities as they arise"` (S)

#### 16.4 Establish and Manage an Inventory of Third-Party Software Components (PDF p.156) — **corrected**

- Removed: `establish and manage an updated inventory of third-party components used in development` (G); `evaluate the list at least monthly to identify any changes or updates to these components and validate that the component is still supported` (G); `updated inventory of third-party components` (C); `bill of materials` (C); `components slated for future use` (C); `risks that each third-party component could pose` (C); `monthly evaluation` (C); `component support validation` (C); `third-party components used in development` (S); `often referred to as bill of materials` (S); `components slated for future use` (S); `identify any changes or updates to these components` (S); `validate that the component is still supported` (S); `software composition analysis (SCA) tools` (I); `dependency management systems` (I); `component vulnerability databases` (I); `automated inventory tracking tools` (I)

- Added: `Establish` (G); `Manage` (G); `Updated` (G); `Evaluate list at least monthly` (G); `Identify` (G); `Validate Support` (G); `Inventory of Third-Party Software Components "Aka" (SBOM)` (C); `Third-Party Software Components Slated for future use` (C); `Any changes or updates to the components and are supported` (S)

- Kept: `any risks that each third-party component could pose` (S)

#### 16.5 Use Up-to-Date and Trusted Third-Party Software Components (PDF p.157) — **corrected**

- Removed: `use up-to-date and trusted third-party software components` (G); `up-to-date third-party software components` (C); `trusted third-party software components` (C); `established and proven frameworks and libraries` (C); `adequate security` (C); `trusted sources` (C); `vulnerability evaluation before use` (C); `when possible choose established and proven frameworks and libraries` (S); `that provide adequate security` (S); `software composition analysis (SCA) tools` (I); `trusted software repositories` (I); `vulnerability scanning tools` (I); `component security assessment processes` (I)

- Added: `Use` (G); `Up to Date` (C); `Trusted` (C); `Third-Party Software Components` (C); `Choose established and proven frameworks and libraries` (I); `Who provide Adequate Security` (I)

- Kept: `acquire these components from trusted sources` (S); `evaluate the software for vulnerabilities before use` (S)

#### 16.6 Establish and Maintain a Severity Rating System and Process for Application Vulnerabilities (PDF p.158) — **corrected**

- Removed: `establish and maintain a severity rating system and process for application vulnerabilities` (G); `prioritizing the order in which discovered vulnerabilities are fixed` (C); `minimum level of security acceptability for releasing code or applications` (C); `severity ratings bring a systematic way of triaging vulnerabilities` (S); `improves risk management` (S); `CVSS scoring systems` (I); `vulnerability management platforms` (I); `risk assessment frameworks` (I); `prioritization workflows` (I)

- Moved: `systematic way of triaging vulnerabilities` C→S

- Added: `Establish` (G); `Maintain` (G)

- Kept: `review and update the system and process annually` (G); `severity rating system` (C); `process for application vulnerabilities` (C); `facilitates prioritizing the order in which discovered vulnerabilities are fixed` (S); `setting a minimum level of security acceptability for releasing code or applications` (S); `helps ensure the most severe bugs are fixed first` (S)

#### 16.7 Use Standard Hardening Configuration Templates for Application Infrastructure (PDF p.159) — **corrected**

- Removed: `use standard, industry-recommended hardening configuration templates for application infrastructure components` (G); `standard hardening configuration templates` (C); `application infrastructure components` (C); `Platform as a Service (PaaS) components` (C); `SaaS components` (C); `industry-recommended hardening configuration templates` (S); `includes underlying servers, databases, and web servers` (S); `applies to cloud containers` (S); `applies to Platform as a Service (PaaS) components` (S); `applies to SaaS components` (S); `configuration baseline tools` (I); `infrastructure as code (IaC) templates` (I); `security hardening guides` (I); `automated configuration management` (I)

- Moved: `underlying servers` C→S; `databases` C→S; `web servers` C→S; `cloud containers` C→S

- Added: `Use` (G); `Standard Hardening Configuration Templates for Application Infrastructure` (C); `PaaS` (S); `SaaS` (S)

- Kept: `do not allow in-house developed software to weaken configuration hardening` (G)

#### 16.8 Separate Production and Non-Production Systems (PDF p.160) — **corrected**

- Removed: `maintain separate environments for production and non-production systems` (G); `separate environments` (C); `separate environments for production systems` (S); `separate environments for non-production systems` (S); `network segmentation tools` (I); `environment isolation technologies` (I); `access control systems` (I); `deployment pipeline controls` (I)

- Added: `Maintain` (G); `Separate Environments For` (C)

- Kept: `production systems` (C); `non-production systems` (C)

#### 16.9 Train Developers in Application Security Concepts and Secure Coding (PDF p.161) — **corrected**

- Removed: `ensure that all software development personnel receive training in writing secure code` (G); `training in writing secure code` (C); `specific development environment and responsibilities` (C); `promote security within the development team` (C); `all software development personnel receive training` (S); `for their specific development environment and responsibilities` (S); `training can include general security principles` (S); `training can include application security standard practices` (S); `security training and awareness tools` (I); `secure coding training programs` (I); `developer security certifications` (I); `hands-on security workshops` (I)

- Moved: `build a culture of security among the developers` C→S; `general security principles` C→I; `application security standard practices` C→I

- Added: `Ensure` (G); `All software development personnel recieve training` (C); `Writing secure code` (S); `Specific development environment` (S); `Specific development responsibilities` (S)

- Kept: `conduct training at least annually` (G); `design in a way to promote security within the development team` (S)

#### 16.10 Apply Secure Design Principles in Application Architectures (PDF p.162) — **corrected**

- Removed: `apply secure design principles in application architectures` (G); `enforcing mediation to validate every operation` (C); `never trust user input` (C); `explicit error checking for all input` (C); `promoting the concept of never trust user input` (S); `ensuring that explicit error checking is performed and documented for all input` (S); `including for size, data type, and acceptable ranges or formats` (S); `secure architecture frameworks` (I); `input validation libraries` (I); `access control systems` (I); `security design patterns` (I)

- Moved: `secure design principles` C→S; `concept of least privilege` C→S; `minimizing the application infrastructure attack surface` C→S; `turning off unprotected ports and services` S→I; `removing unnecessary programs and files` S→I; `renaming or removing default accounts` S→I

- Added: `Apply` (G); `Secure design principles in application architectures` (C); `Concept of “never trust user input` (S); `Ensuring that explicit error checking is performed for all input` (I); `Explicit error checking is documented for all input` (I); `Size` (I); `Data type` (I); `Acceptable Ranges` (I); `Acceptable Formats` (I)

- Kept: `enforcing mediation` (S); `validate every operation that the user makes` (S)

#### 16.11 Leverage Vetted Modules or Services for Application Security Components (PDF p.163) — **corrected**

- Removed: `leverage vetted modules or services for application security components` (G); `use only standardized, currently accepted, and extensively reviewed encryption algorithms` (G); `vetted modules or services` (C); `auditing and logging` (C); `platform features in critical security functions` (C); `identification, authentication, and authorization mechanisms` (C); `secure audit logs` (C); `such as identity management, encryption, and auditing and logging` (S); `using platform features in critical security functions will reduce developers' workload` (S); `minimize the likelihood of design or implementation errors` (S); `modern operating systems provide effective mechanisms for identification, authentication, and authorization` (S); `make those mechanisms available to applications` (S); `established security libraries` (I); `platform security services` (I); `cryptographic modules` (I); `operating system security features` (I)

- Moved: `operating systems also provide mechanisms to create and maintain secure audit logs` S→I; `identity management` C→I; `encryption` C→I

- Added: `Leverage` (G); `Use Only` (G); `Vetted Services` (C); `Vetted Modules` (C); `Encryption Algorithms` (S); `Standardized` (S); `Currently accepted` (S); `Extensively reviewed` (S); `Modern operating systems provide effective mechanisms for identification, authentication, and authorization and make those mechanisms available to applications` (I); `Using platform features in critical security functions will reduce developers’ workload and minimize the likelihood of design or implementation errors` (I); `Auditing` (I); `Logging` (I)

- Kept: `application security components` (C)

#### 16.12 Implement Code-Level Security Checks (PDF p.164) — **corrected**

- Removed: `apply static and dynamic analysis tools within the application life cycle to verify that secure coding practices are being followed` (G); `static analysis tools` (C); `dynamic analysis tools` (C); `secure coding practices verification` (C); `apply static analysis tools within the application life cycle` (S); `apply dynamic analysis tools within the application life cycle` (S); `verify that secure coding practices are being followed` (S); `code analysis tools` (I); `static application security testing (SAST)` (I); `dynamic application security testing (DAST)` (I); `interactive application security testing (IAST)` (I)

- Moved: `application life cycle` C→S

- Added: `Apply` (G); `Verify` (G); `Practices are being followed` (G); `Static Dynamic analysis analysis tools tools` (C); `Code Level Security Checks` (C); `Secure coding practices` (S)

#### 16.13 Conduct Application Penetration Testing (PDF p.165) — **corrected**

- Removed: `conduct application penetration testing` (G); `authenticated penetration testing for critical applications` (C); `manual manipulation of application` (C); `authenticated and unauthenticated user testing` (C); `for critical applications` (S); `authenticated penetration testing is better suited to finding business logic vulnerabilities` (S); `than code scanning and automated security testing` (S); `penetration testing relies on the skill of the tester` (S); `to manually manipulate an application as an authenticated and unauthenticated user` (S); `application security testing tools` (I); `penetration testing frameworks` (I); `security testing methodologies` (I); `skilled penetration testers` (I)

- Moved: `business logic vulnerabilities` C→S

- Added: `Conduct` (G); `Critical applications` (S); `Non-Critical Applications` (S); `Authenticated penetration testing` (S); `Code scanning` (S); `Automated security testing` (S); `Penetration testing relies on the skill of the tester to MANUALLY manipulate an application` (S); `Authenticated user` (S); `Unauthenticated user` (S); `Better Suited to finding` (I)

- Kept: `application penetration testing` (C)

#### 16.14 Conduct Threat Modeling (PDF p.166) — **corrected**

- Removed: `conduct threat modeling` (G); `identifying and addressing application security design flaws` (C); `evaluate application design` (C); `gauge security risks for each entry point and access level` (C); `map out the application, architecture, and infrastructure` (C); `threat modeling is the process of identifying and addressing application security design flaws within a design` (S); `conducted through specially trained individuals` (S); `who evaluate the application design and gauge security risks` (S); `for each entry point and access level` (S); `the goal is to map out the application, architecture, and infrastructure in a structured way` (S); `to understand its weaknesses` (S); `threat modeling frameworks` (I); `security design review processes` (I); `threat modeling tools` (I); `security architecture documentation` (I)

- Moved: `before code is created` C→S; `specially trained individuals` C→S

- Added: `Conduct` (G); `Conducted Through` (S); `Map out the application to understand its weakness in a structured way` (S); `Architecture` (S); `Infrastructure` (S); `Identifying` (S); `Addressing` (S); `Evaluate Application Design For Each:` (S); `Application security design flaws within an design` (S); `Entry point` (S); `Access level` (S)

- Kept: `threat modeling` (C)

#### 17.1 Designate Personnel to Manage Incident Handling (PDF p.168) — **corrected**

- Removed: `designate one key person and at least one backup who will manage the enterprise's incident handling process` (G); `review annually or when significant enterprise changes occur that could impact this safeguard` (G); `one key person to manage incident handling` (C); `coordination of incident response and recovery efforts` (C); `documentation of incident response and recovery efforts` (C); `management personnel for incident handling process` (C); `management personnel are responsible for coordination and documentation` (S); `can consist of employees internal to the enterprise` (S); `can consist of service providers` (S); `can consist of a hybrid approach` (S); `if using a service provider, designate at least one person internal to the enterprise to oversee any third-party work` (S); `incident response team structures` (I); `incident management roles and responsibilities` (I); `coordination tools and processes` (I); `documentation templates` (I)

- Added: `Designate` (G); `Review` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `One Key Person` (C); `Personnel to Manage Incident Handling` (C); `Responsible for` (S); `Coordination` (S); `Documentation` (S); `Incident Response` (S); `Recovery efforts` (S); `Employees internal to the enterprise` (I); `Service Provider` (I); `Hybrid Approach` (I); `Designate one person internal to the enterprise to oversee any third-party work` (I)

- Kept: `at least one backup person` (C)

#### 17.2 Establish and Maintain Contact Information for Reporting Security Incidents (no PDF page) — **no-pdf-page**

- No page in the governing PDF; reconciled against official CIS text only.

#### 17.3 Establish and Maintain an Enterprise Process for Reporting Incidents (PDF p.169) — **corrected**

- Removed: `establish and maintain a documented enterprise process for the workforce to report security incidents` (G); `ensure the process is publicly available to all of the workforce` (G); `review annually or when significant enterprise changes occur that could impact this safeguard` (G); `the process includes reporting timeframe` (S); `the process includes personnel to report to` (S); `the process includes mechanism for reporting` (S); `the process includes the minimum information to be reported` (S); `incident reporting procedures` (I); `reporting forms and templates` (I); `workforce training materials` (I); `process communication methods` (I)

- Moved: `reporting timeframe` C→S; `personnel to report to` C→S; `mechanism for reporting` C→S; `minimum information to be reported` C→S

- Added: `Establish` (G); `Maintain` (G); `Review` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Ensure` (G); `The Process Includes` (S); `Publicly available to all of the workforce` (S)

- Kept: `documented enterprise process for reporting incidents` (C)

#### 17.4 Establish and Maintain an Incident Response Process (PDF p.170) — **corrected**

- Removed: `establish and maintain a documented incident response process` (G); `review annually or when significant enterprise changes occur that could impact this safeguard` (G); `roles and responsibilities` (C); `that addresses roles and responsibilities` (S); `that addresses compliance requirements` (S); `that addresses a communication plan` (S); `incident response playbooks` (I); `process documentation templates` (I); `compliance frameworks` (I); `communication protocols` (I)

- Moved: `compliance requirements` C→S; `communication plan` C→S

- Added: `Establish` (G); `Maintain` (G); `Review` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `That Addresses` (S); `Roles` (S); `Responsibilites` (S)

- Kept: `documented incident response process` (C)

#### 17.5 Assign Key Roles and Responsibilities (PDF p.171) — **corrected**

- Removed: `assign key roles and responsibilities for incident response` (G); `review annually or when significant enterprise changes occur that could impact this safeguard` (G); `key roles and responsibilities for incident response` (C); `staff from legal` (C); `staff from IT` (C); `staff from information security` (C); `staff from facilities` (C); `staff from public relations` (C); `staff from human resources` (C); `including staff from legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts` (S); `incident response team structures` (I); `role definition templates` (I); `responsibility matrices` (I); `cross-functional team coordination` (I)

- Moved: `incident responders` C→S; `analysts` C→S

- Added: `Assign` (G); `Review` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Incident Response` (C); `Including Staff from` (S); `Legal` (S); `IT` (S); `information security` (S); `Facilities` (S); `Public relations` (S); `Human resources` (S)

#### 17.6 Define Mechanisms for Communicating During Incident Response (PDF p.172) — **corrected**

- Removed: `determine which primary and secondary mechanisms will be used to communicate and report during a security incident` (G); `review annually or when significant enterprise changes occur that could impact this safeguard` (G); `primary mechanisms for communicating during incident response` (C); `secondary mechanisms for communicating during incident response` (C); `mechanisms to communicate during security incident` (C); `mechanisms to report during security incident` (C); `mechanisms can include phone calls` (S); `mechanisms can include emails` (S); `mechanisms can include secure chat` (S); `mechanisms can include notification letters` (S); `keep in mind that certain mechanisms, such as emails, can be affected during a security incident` (S); `communication platforms` (I); `backup communication methods` (I); `secure messaging systems` (I); `notification systems` (I)

- Added: `Determine` (G); `Review` (G); `Annually` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Mechanisms for Communicating During Incident Response` (C); `Primary` (C); `Secondary` (C); `Communicate` (C); `Report` (C); `Phone calls` (I); `Emails` (I); `Secure Chat` (I); `Notification Letters` (I)

#### 17.7 Conduct Routine Incident Response Exercises (PDF p.173) — **corrected**

- Removed: `plan and conduct routine incident response exercises and scenarios for key personnel involved in the incident response process` (G); `conduct testing on an annual basis, at a minimum` (G); `scenarios for key personnel` (C); `to prepare for responding to real-world incidents` (S); `exercises need to test communication channels, decision-making, and workflows` (S); `tabletop exercises` (I); `simulation scenarios` (I); `exercise planning frameworks` (I); `testing schedules and protocols` (I)

- Moved: `prepare for responding to real-world incidents` C→S; `test communication channels` C→S; `test decision-making` C→S; `test workflows` C→S

- Added: `Plan` (G); `Conduct` (G); `At a minimum` (G); `Conduct testing on an annual basis` (G); `Routine Scenarios` (C); `Exercises Need to` (S)

- Kept: `routine incident response exercises` (C); `key personnel involved in the incident response process` (S)

#### 17.8 Conduct Post-Incident Reviews (PDF p.174) — **corrected**

- Removed: `conduct post-incident reviews` (G); `prevent incident recurrence` (C); `post-incident reviews help prevent incident recurrence` (S); `through identifying lessons learned and follow-up action` (S); `post-incident review templates` (I); `lessons learned documentation` (I); `improvement action plans` (I); `review meeting processes` (I)

- Moved: `identifying lessons learned` C→S; `follow-up action` C→S

- Added: `Conduct` (G); `Help prevent incident recurrence` (G)

- Kept: `post-incident reviews` (C)

#### 17.9 Establish and Maintain Security Incident Thresholds (PDF p.175) — **corrected**

- Removed: `establish and maintain security incident thresholds` (G); `review annually or when significant enterprise changes occur that could impact this safeguard` (G); `differentiating between an incident and an event` (C); `incident classification criteria` (C); `including, at a minimum, differentiating between an incident and an event` (S); `examples can include abnormal activity` (S); `examples can include security vulnerability` (S); `examples can include security weakness` (S); `examples can include data breach` (S); `examples can include privacy incident` (S); `incident classification frameworks` (I); `threshold definition templates` (I); `severity rating systems` (I); `incident categorization tools` (I)

- Added: `Establish` (G); `Maintain` (G); `Ensure` (G); `Review` (G); `At a minimum` (G); `When significant enterprise changes occur that could impact this Safeguard` (G); `Annually` (G); `Differentiating between` (S); `Incident` (S); `Event` (S); `Abnormal Activity` (I); `Security vulnerability` (I); `Data breach` (I); `Security weakness` (I); `Privacy incident` (I)

- Kept: `security incident thresholds` (C)

#### 18.1 Establish and Maintain a Penetration Testing Program (PDF p.177) — **corrected**

- Removed: `establish and maintain a penetration testing program appropriate to the size, complexity, industry, and maturity of the enterprise` (G); `scope including network, web application, API, hosted services, and physical premise controls` (C); `frequency requirements` (C); `limitations including acceptable hours and excluded attack types` (C); `point of contact information` (C); `remediation procedures for routing findings internally` (C); `appropriate to the size, complexity, industry, and maturity of the enterprise` (S); `penetration testing program characteristics include scope` (S); `such as network, web application, Application Programming Interface (API), hosted services, and physical premise controls` (S); `characteristics include frequency` (S); `characteristics include limitations, such as acceptable hours, and excluded attack types` (S); `characteristics include point of contact information` (S); `characteristics include remediation, such as how findings will be routed internally` (S); `characteristics include retrospective requirements` (S); `penetration testing frameworks` (I); `program documentation templates` (I); `scope definition guidelines` (I); `testing frequency schedules` (I)

- Moved: `retrospective requirements` C→I

- Added: `Establish` (G); `Maintain` (G); `Appropriate` (G); `Complexity` (G); `Size` (G); `industry` (G); `Maturity` (G); `Of the Enterprise` (G); `Characteristics include` (S); `Scope` (S); `Frequency` (S); `Limitations` (S); `POC info` (S); `Remediation` (S); `Network` (I); `Hosted Services` (I); `Web Applications` (I); `API` (I); `Acceptable hours` (I); `excluded attack types` (I); `How findings will be routed internally` (I)

- Kept: `penetration testing program` (C)

#### 18.2 Perform Periodic External Penetration Tests (PDF p.178) — **corrected**

- Removed: `perform periodic external penetration tests based on program requirements, no less than annually` (G); `external penetration testing must include enterprise and environmental reconnaissance to detect exploitable information` (G); `penetration testing requires specialized skills and experience and must be conducted through a qualified party` (G); `periodic external penetration tests` (C); `detect exploitable information` (C); `specialized skills and experience` (C); `qualified party to conduct testing` (C); `the testing may be clear box or opaque box` (S); `external penetration testing services` (I); `reconnaissance tools and techniques` (I); `qualified penetration testing vendors` (I); `clear box and opaque box methodologies` (I)

- Moved: `based on program requirements` S→G; `no less than annually` S→G; `enterprise reconnaissance` C→S; `environmental reconnaissance` C→S

- Added: `Perform periodic` (G); `Must be conducted through a qualified party` (G); `Must Include` (G); `External Penetration Tests` (C); `Clear box` (S); `Opaque box` (S)

- Kept: `to detect exploitable information` (S)

#### 18.3 Remediate Penetration Test Findings (PDF p.179) — **corrected**

- Removed: `remediate penetration test findings based on the enterprise's documented vulnerability remediation process` (G); `remediate penetration test findings` (C); `documented vulnerability remediation process` (C); `timeline for remediation` (C); `level of effort determination` (C); `impact assessment` (C); `prioritization of findings` (C); `this should include determining a timeline and level of effort` (S); `based on the impact and prioritization of each identified finding` (S); `vulnerability remediation workflows` (I); `finding prioritization frameworks` (I); `remediation tracking systems` (I); `impact assessment methodologies` (I)

- Added: `Remediate` (G); `Based on enterprise's policy` (G); `Penetration Test Findings` (C); `Impact` (S); `Prioritization` (S); `Timeline` (S); `Level of effort` (S)

#### 18.4 Validate Security Measures (PDF p.180) — **corrected**

- Removed: `validate security measures after each penetration test` (G); `validate security measures` (C); `modify rulesets if necessary` (C); `modify capabilities if necessary` (C); `detect techniques used during testing` (C); `after each penetration test` (S); `security control validation frameworks` (I); `detection rule tuning processes` (I); `capability enhancement procedures` (I); `technique analysis methodologies` (I)

- Moved: `if deemed necessary` S→G

- Added: `Validate` (G); `Security measures after each penetration test` (C); `Modify` (S); `Rulesets` (S); `Capabilities` (S)

- Kept: `to detect the techniques used during testing` (S)

#### 18.5 Perform Periodic Internal Penetration Tests (PDF p.181) — **corrected**

- Removed: `perform periodic internal penetration tests based on program requirements, no less than annually` (G); `periodic internal penetration tests` (C); `program requirements compliance` (C); `annual testing frequency minimum` (C); `the testing may be clear box or opaque box` (S); `internal penetration testing tools` (I); `internal testing methodologies` (I); `clear box and opaque box approaches` (I); `internal security assessment frameworks` (I)

- Moved: `based on program requirements` S→G; `no less than annually` S→G

- Added: `Perform Periodic` (G); `Internal Penetration Tests` (C); `Clear box` (S); `Opaque box` (S)
