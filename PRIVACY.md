# Privacy Notice — Ethical Impact Assessment (AIE) Source Code

> **Scope of this document.** This Privacy Notice describes how the *source code* of the **Ethical Impact Assessment (AIE)** platform — published as open source for adoption by other public administrations — processes personal data **by design**. It is intentionally *abstracted* from the Brazilian deployment.
>
> If you are an **end user in Brazil**, the controlling document is the Portuguese-language Privacy Notice published by the Brazilian Ministry of Management and Innovation in Public Services (MGI) acessible at our deployment. This English summary is meant for **other nations and organisations adapting the codebase** to their own legal and institutional context — *not* a substitute for a locally-adapted Privacy Notice that they must produce.
>
> **Version**: 0.6.
> **Last update**: 2026-06-21.

---

## 1. Why this document exists

The AIE platform supports public-sector organisations in performing **structured ethical self-assessments of artificial-intelligence initiatives**. The source code is released under an open licence so that other nations and organisations can deploy their own instances. This document tells adopters **what personal data the code processes by default**, **for which purposes**, and **what they must substitute or configure** before operating the platform under their own jurisdiction's data-protection law.

Adopters should read this notice alongside the Brazilian-Portuguese reference Privacy Notice and then produce **their own** Privacy Notice tailored to: (i) their data-protection statute; (ii) their identity-provider and civil-servant verification infrastructure; (iii) their document-retention rules; and (iv) their own controller and data-protection-officer identity and contacts.

## 2. Reference framework

The AIE source code was originally designed to comply with the **Brazilian General Data Protection Law (LGPD — Law No. 13,709/2018)**. Adopters in other jurisdictions should map the principles below onto their local statute (e.g., GDPR in the EU, etc):

- **Lawfulness based on the execution of public policy / public interest** (LGPD art. 7, III, c/c art. 23) is the principal legal basis assumed by the source code, because the platform delivers AI projects assessments to civil servants as a public service.
- **Cumulative legal basis of compliance with a legal/regulatory obligation** (LGPD art. 7, II) is assumed for security-of-information logs and administrator-account management.
- The source code is **not** designed around consent or legitimate interest as legal bases; adapters in jurisdictions where those bases are required should change the legal basis accordingly.

## 3. Categories of personal data processed by the code

The source code processes the following categories. None of them are **sensitive personal data** under LGPD art. 11 (or its analogues elsewhere): the platform is **not designed** to handle racial, religious, political, health, sexual-life, genetic, or biometric data. Free-text fields exist (questionnaire answers), and the documentation warns users not to enter sensitive or third-party personal data into them.

- **Federated authentication data** — name, civil-servant identifier, institutional email obtained from an external identity provider during sign-in.
- **Civil-servant eligibility verification data** — information returned by a national civil-servant registry's open-data API consulted at sign-in to verify the user's eligibility.
- **Administrator account data** — name, civil-servant identifier, institutional email, position/role, and a password stored only as a **bcrypt hash**.
- **AI-project record data** — the name of the person responsible for each registered AI project (free-text input) and identifiers of colleagues invited by the project owner to collaborate on the self-assessment.
- **Audit records** — automatic logs of authenticated user e-mail, IP address, user-agent, route, HTTP method, action, status, timestamp, and request technical details, captured on create/update/delete operations and on sign-in events.

> **Adopter checklist (categories)**: confirm whether your jurisdiction classifies any of the fields above as sensitive. If so, you must either (i) avoid collecting it; or (ii) base the processing on a specific legal authorisation applicable to sensitive data.

## 4. Purposes of Processing

The source code performs four canonical activities of processing. Each one must be reviewed and authorised under your jurisdiction's data-protection law.

| # | Purpose | Affected data subjects | Categories processed |
|---|---|---|---|
| 1 | Authenticate civil-servant users via a federated identity provider, verify eligibility against a national civil-servant registry API, and maintain an authenticated session via JWT | Civil servants entitled to use the platform | Federated authentication data; eligibility verification data |
| 2 | Authenticate platform administrators with proprietary credentials (e-mail + password) for service-configuration operations and track their last sign-in | Designated administrators | Administrator account data |
| 3 | Register and manage AI projects submitted for self-assessment, identifying the responsible person and allowing optional sharing with colleagues nominated by the project owner | Project owners and invited collaborators | AI-project record data |
| 4 | Maintain audit records of operations performed in the platform (create / update / delete / sign-in) for traceability, security, and accountability | All authenticated users | Audit records |

**Secondary use.** Where the controller produces consolidated reports or research on ethical-AI maturity in the public sector, personal data are **anonymised** beforehand (LGPD art. 12: anonymised data are no longer personal data).

**Automated decisions.** The platform does **not** make automated decisions affecting the data subjects: the score it produces refers to the *AI project being assessed*, not to the data subject. Adopters can reproduce this clarification in their local notice to forestall confusion with rules such as GDPR art. 22 or LGPD art. 20.

## 5. Source of the data

- **Provided directly by the data subject** — when the user completes a form, registers a project, invites a collaborator, or fills questionnaires.
- **Obtained from the external identity provider** — at sign-in, the platform receives identity claims (e.g. `id_token` and userinfo) via an OAuth 2.0 / OpenID Connect flow with PKCE.
- **Obtained from a national civil-servant registry API** — consulted automatically at sign-in to verify eligibility.
- **Collected automatically during use** — audit records are captured by the application's audit interceptor.

> **Adopter checklist (source)**: substitute the federated identity provider (the Brazilian deployment uses the national Gov.br SSO) with **your nation's federated identity provider**. Substitute the civil-servant registry API (the Brazilian deployment uses the Federal Transparency Portal API) with **your nation's equivalent** — or, if such an API does not exist, design an alternative eligibility check and update this notice accordingly.

## 6. Cookies

The source code uses **strictly-necessary cookies only**: (i) a session cookie for the JWT-authenticated session and (ii) support for the OAuth 2.0 / OIDC + PKCE flow with the external identity provider. There is **no** analytics, telemetry, advertising, profiling, or third-party tracking. Strictly-necessary cookies do not require prior consent under the consolidated guidance of our data-protection authority.

## 7. Retention

- **Authentication, account, eligibility-verification, and project-record data** — retained only for the period strictly necessary to fulfil the declared purposes, observing the controller's records-management and document-retention rules.
- **Audit records** — retained for the period required by the local data-protection authority's policy and the local internet-records statute. The Brazilian deployment uses **one (1) year**; adopters should map this to their statute (e.g., minima under their local civil-rights or telecommunications-records statute).
- **Project records after end of purpose** — anonymised and preserved under the controller's archival rules for institutional memory, accountability, and knowledge-management purposes.

> **Adopter checklist (retention)**: replace these durations with the periods mandated by your national legal-deposit, archival, and records-of-internet-access rules.

## 8. Sharing

The source code presupposes the following types of sharing — adopters must identify the equivalents in their jurisdiction and amend the notice:

- **Operators (processors) acting on behalf of the controller**:
  - the operator of the federated identity provider used for sign-in;
  - the manager of the civil-servant registry API used for eligibility verification;
  - if applicable, the cloud-database operator (the code is cloud-vendor-agnostic — no specific provider is assumed in the codebase).
- **Categories of recipients** with whom the controller may share data in specific legal hypotheses:
  - organisations and bodies responsible for the AI projects registered on the platform (institutional management);
  - oversight bodies (the national audit office, internal-control authority, public prosecution service), in the exercise of supervisory functions;
  - judicial authorities in the exercise of jurisdictional functions.

Personal data are **not** used for marketing and are **not** transferred to private entities outside the legal hypotheses applicable to public-sector data sharing.

## 9. International transfer

The Brazilian deployment of AIE operates **entirely within national territory**. The source code itself does not require international transfer; adopters should verify the geographical location of their used infrastructure and disclose any international transfer accordingly.

## 10. Security measures (technical baseline of the source code)

- TLS / HTTPS encryption of all transport between client and servers;
- OAuth 2.0 / OpenID Connect with PKCE S256 for federated authentication;
- JWT session tokens with controlled expiry and refresh;
- Administrator passwords stored only as bcrypt hashes;
- Database hosted on a private network, not exposed to the public internet;
- Separation of development and production environments;
- Audit logging of mutating operations and sign-in events;
- Role-based authorisation in the backend;
- Secrets and credentials managed via environment variables.

> **Adopter checklist (security)**: map these controls onto your jurisdiction's information-security policy and inform the data subject in your local notice.

## 11. Data-subject rights

The codebase assumes the existence of data-subject rights analogous to those of LGPD art. 18 — confirmation of processing; access; correction; anonymisation, blocking, or deletion of unnecessary or unlawfully processed data; portability; information about sharing; and the right to petition the competent data-protection authority. The codebase does **not** implement consent withdrawal flows by default, because the underlying legal basis is not consent.

Where technically feasible, the platform may provide mechanisms to facilitate the exercise of some of these rights. However, the existence of such rights does not imply that they can necessarily be exercised automatically through the platform itself. Data-subjects may also exercise their rights through alternative channels made available by the controller, including external procedures and contact mechanisms established for handling data-subject rights requests, subject to applicable legal and regulatory requirements.

> **Adopter checklist (rights)**: ensure your local notice describes the channels through which data subjects exercise these rights in your jurisdiction.

## 12. Breach notification

The source code does not, by itself, implement breach detection or notification. Adopters must integrate the platform's audit records and incident-response procedures with their **national data-protection authority's** breach-notification requirements (LGPD art. 48), and disclose those procedures in their local notice.

## 13. Contact

The Brazilian deployment lists its controller, contact channels, and Data Protection Officer in the Portuguese Privacy Notice. **Adopters** must replace those references with their own organisation's data-controller identification, contact channels, and DPO/equivalent.

---

## Adopter quick-reference: what to replace before deploying

| Element used in the Brazilian deployment | Generic placeholder for adopters |
|---|---|
| Brazilian Gov.br Single Sign-On (federated identity provider) | *Your nation's federated identity provider* |
| Federal Transparency Portal open-data API (civil-servant registry) | *Your nation's civil-servant or eligibility registry API (or an equivalent verification mechanism)* |
| Brazilian Ministry of Management and Innovation in Public Services (MGI / SGD) — controller | *Your organisation as controller* |
| MGI Data Protection Officer | *Your organisation's DPO or equivalent* |
| Brazilian LGPD legal bases | *Equivalent lawful bases under your jurisdiction's data-protection law* |
| Resolução CPDP/MGI nº 8/2026 | *Your jurisdiction's records-of-access / data-protection-authority retention rules* |
| Brazilian Marco Civil da Internet (Law 12,965/2014) | *Your jurisdiction's internet-records statute, if any* |
| Federal Court — Federal District jurisdiction (forum) | *Your jurisdiction's competent court* |
| Brazilian National Data Protection Authority (ANPD) | *Your jurisdiction's data-protection authority* |

The source code is **cloud-vendor-agnostic**: it does not assume any specific cloud provider. Where applicable, adopters may disclose in their own notice the actual cloud provider they choose and the geographical location of their data.

---

*This document is periodically reviewed in alignment with the Brazilian Privacy Notice and with the evolution of the AIE platform's codebase. Privacy, data protection, and transparency requirements vary across jurisdictions and deployment scenarios. Organizations using or adapting the software are responsible for preparing and maintaining any privacy documentation and disclosures required for their particular deployment, legal environment, and operational practices.*
