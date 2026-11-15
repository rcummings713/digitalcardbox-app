# DEV authentication email templates

These are **Supabase Auth templates**, delivered through Resend SMTP. Supabase renders `{{ .SiteURL }}` and `{{ .TokenHash }}`; these are not Resend template variables. Account verification and recovery continue through the existing app endpoints. The files contain no credentials or real tokens.

| File | Supabase template | Subject |
| --- | --- | --- |
| confirm-signup.html | Confirm sign up | Confirm your TheDigitalCardBox account |
| reset-password.html | Reset password | Reset your TheDigitalCardBox password |

Paste each complete HTML file into the corresponding Supabase template after custom SMTP is configured. Set Site URL to the stable DEV site from ACCOUNT_AND_AI_SETUP.md. Keep confirmation enabled. An SMTP connection or local HTML preview alone does not prove delivery or successful confirmation/recovery; run the real DEV flows and record the result before acceptance.

Use a verified sending subdomain approved by the owner, US East as the default sending region for this US-based DEV setup, and a domain-restricted `sending_access` key named `TheDigitalCardBox DEV Auth SMTP`. Region/return-path selection is made before domain creation. Keep click and open tracking off for authentication links. Add only the records actually returned by Resend; preserve existing root mail/DNS records. DNS approval and external account access are required before deployment.

The sending key is stored in **Supabase SMTP Password**. The browser and Cloudflare app do not need a Resend key for this integration. Setup OAuth/full-access credentials remain in the agent credential store and are not application credentials. Keep any transient credentials outside the repository and never print them. No marketing, contacts import, inbox, or paid plan is configured by this task.

## Owner-confirmed domain — 14 November 2026

The business owner confirmed `thedigitalcardbox.com`; the earlier project contact domain `digitalcardbox.com` was only a historical clue and is not used for this SMTP setup. The owner-provided domain dashboard confirms management through **Cheapnames.com**, a separate service from Namecheap. This resolves the earlier provider/account question. The public registry/DNS check lists Wild West Domains, LLC as registrar and `ns45.domaincontrol.com` / `ns46.domaincontrol.com` as authoritative nameservers (GoDaddy DNS). Existing Microsoft 365 mail and the quarantine DMARC policy remain in place.

Created Resend sending domain `auth-dev.thedigitalcardbox.com` (US East, ID `bf674e71-47e1-4677-a793-af3d00f09fef`) with receiving and click/open tracking disabled. Sender: `TheDigitalCardBox <no-reply@auth-dev.thedigitalcardbox.com>`. The exact four public DNS additions are in `resend-dev-dns.json`. A live website and a new mailbox are not required for this sending-only subdomain.

[Resend domain status](https://resend.com/domains/bf674e71-47e1-4677-a793-af3d00f09fef). The owner installed all four Resend records through Cheapnames.com. Each matches the prepared value on both authoritative nameservers and the Cloudflare/Google public resolvers. Resend reports verified; all four records are verified. The prepared sending-only credential passed SMTP authentication over verified TLS (235); no email was sent. Existing Microsoft 365 mail, root SPF/DMARC and nameservers remain intact. On 15 November, the owner-configured email/password setup passed live DEV signup, email confirmation, sign-in, sign-out, password recovery and sign-in with the new password. Both emails used the correct sender, subject and DEV application links and reached Resend’s simulated delivery recipient. Email confirmation remains required. Raw Supabase dashboard settings and delivery to a real personal inbox were not inspected; Google and Apple remain disabled. No further DNS changes are needed. The original record-entry instructions remain in [cheapnames-dns-instructions.txt](cheapnames-dns-instructions.txt); do not add duplicate records. Follow [supabase-dev-smtp-instructions.txt](supabase-dev-smtp-instructions.txt) for the remaining dashboard configuration.

The domain-scoped sending key is named `TheDigitalCardBox DEV Auth SMTP`. Its value is kept in macOS Keychain under service `TheDigitalCardBox DEV Resend SMTP`, account `auth-dev.thedigitalcardbox.com`. No secret value is included here. SMTP authentication and the live DEV email/password flow are validated with a simulated recipient; a real personal-inbox delivery check remains separate.

### Supabase SMTP field mapping

| Supabase field | Prepared value |
| --- | --- |
| Enable custom SMTP | On, after the sending domain verifies |
| Sender email | `no-reply@auth-dev.thedigitalcardbox.com` |
| Sender name | `TheDigitalCardBox` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | The private value of `TheDigitalCardBox DEV Auth SMTP` from macOS Keychain; not its key ID |

The owner can copy the stored value privately on this Mac with the command below, then paste it directly into Supabase's SMTP Password field. The pipe copies it without displaying it in Terminal. macOS may ask the owner to allow Keychain access. Do not paste the resulting clipboard contents into chat.

```sh
security find-generic-password -s 'TheDigitalCardBox DEV Resend SMTP' -a 'auth-dev.thedigitalcardbox.com' -w | pbcopy
```

Save SMTP settings, then install `confirm-signup.html` and `reset-password.html` in their corresponding Supabase template editors with the subjects above. Keep the stable DEV Site URL and redirect allowlist from ACCOUNT_AND_AI_SETUP.md. The initial 30/hour Supabase custom-SMTP limit can remain for DEV.


15 November DEV verification evidence: [sanitized email workflow report](dev-email-verification.json). One empty, clearly labeled QA host account remains; no events were created, and temporary credentials were removed after sign-out. Keep story #8 OPEN / In Progress for owner review and the remaining provider/production acceptance.
