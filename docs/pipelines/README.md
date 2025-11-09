# Pipeline Templates

These JSON templates power the listing/buyer workflow automation.

| File | Description |
| --- | --- |
| `listing-transaction-seller.json` | Default seller-side listing pipeline (Pre-Listing → Active Listing → Escrow). |
| `buyer-transaction.json` | Buyer representation pipeline from consultation through closing. |
| `listing-paperwork-checklist.json` | Document checklist referenced by listing tasks. |
| `transaction-timeline.json` | Recommended 30-day escrow milestone timeline. |

## JSON Schema Overview

- **Pipeline templates** contain `stages` and `tasks` with optional triggers and due-date offsets.
- **Checklists/timelines** are stored as documents (`Document` table) so they can be surfaced in the UI alongside tasks.

Run `npm run seed:pipelines` after deployment or database reset to load/update these templates.

