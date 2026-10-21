# Documentation map

- `specs/LOCAL_API.md`: local persistent host/guest API and test boundaries.
- `adr/0008-local-backend-review.md`: isolated local backend while production adapters remain open.
- `specs/UI_DESIGN.md`: current application pages and UI-first review boundaries.
- `../planning/UI_REVIEW.md`: owner review sequence, decisions and issue mapping.
- `adr/0007-ui-first-design-review.md`: account-free UI before backend implementation.
- `specs/PRODUCT.md`: product behavior and October boundaries.
- `specs/MVP_ACCEPTANCE.md`: release gates and test matrix.
- `specs/SECURITY_PAYMENT.md`: authentication, external gift handoff and privacy rules.
- `specs/DATA_MODEL.md`: PostgreSQL tables, relationships, constraints, transactions, retention and separate future purchase/gift ledgers.
- `adr/`: ADR 0001 leaves runtime open until October 14; ADR 0004 records TheDigitalCardBox naming; ADR 0005 selects database design with provider/deployment subject to the spike.
- `../planning/DATABASE_BACKLOG_AUDIT.md`: database coverage, issue mapping and redundancy decisions.
- `reference/`: the current Word financial, system, timeline, executive, journey and question documents. Keep these files in version control and revise them when the product decisions change.

When an implementation detail changes, update the relevant spec, ADR, affected reference document and GitHub issue in the same pull request.

- [Reviewed provider gift handoffs](specs/GIFT_ROUTING.md) — actual Cash App/Venmo profile navigation, Zelle bank guidance, fictional recipient previews and matching boundaries.


- [Card media and AI key setup](specs/CARD_MEDIA.md): curated store, moderated generation, quotas and private feedback. [ADR 0009](adr/0009-hosted-dev-media.md) extends the shared backend to isolated DEV for live QR invitations.
