# Journal Platform — End-to-End Workflow Guide

This document describes the complete 8-step editorial workflow. In **Staging & Production** (`VITE_API_URL=https://journal.kubeletto.app`), all operations run **live against the Spring Boot REST API and PostgreSQL database**. 

When `VITE_API_URL` is omitted or `VITE_DEMO_MODE=true`, the platform runs in offline demo mode using the local memory harness.

## Demo & Seed Accounts

All accounts are pre-seeded in the staging database and ready for immediate sign-in at `/signin`:

| Role | Email | Password |
| --- | --- | --- |
| Publisher / Admin | `admin@journal.com` | `admin123` |
| Editor in Chief | `eic@journal.com` | `eic123` |
| Handling Editor | `editor@journal.com` | `editor123` |
| Handling Editor 2 | `editor2@journal.com` | `editor123` |
| Handling Editor 3 | `editor3@journal.com` | `editor123` |
| Reviewer | `reviewer@journal.com` | `reviewer123` |
| Reviewer 2 | `reviewer2@journal.com` | `reviewer123` |
| Production Editor | `production@journal.com` | `production123` |
| Author | `author@journal.com` | `author123` |
| Author (extra) | `author2@journal.com` | `author123` |

Authors submit manuscripts **without paying upfront**. The **APC (publication fee)** is paid at **Step 6**, after the handling editor approves for publication.

---

## Live End-to-End Happy Path (Submit → Publish)

No revisions, no rejections. Sign out and sign back in between steps when switching roles.

### Step 1 — Author submits manuscript

| | |
| --- | --- |
| **Email** | `author@journal.com` |
| **Password** | `author123` |

1. Go to **Submissions** → **New submission**
2. **Article** — fill title, abstract, keywords, article type → **Next**
3. **Authors** — fill ORCID → **Next**
4. **Files** — upload **Title page** and **Anonymous manuscript** (required) → **Next**
5. **Review** → **Submit**

**Status after:** `submitted`

---

### Step 2 — EIC assigns handling editor

| | |
| --- | --- |
| **Email** | `eic@journal.com` |
| **Password** | `eic123` |

1. Open the new submission from **Submissions**
2. Select **editor@journal.com** in the assign panel
3. **Send invite** → confirm

**Status after:** `assigned`

---

### Step 3 — HE pre-screens and invites reviewers

| | |
| --- | --- |
| **Email** | `editor@journal.com` |
| **Password** | `editor123` |

1. Open the submission
2. If shown: **Accept as Handling Editor** → confirm
3. **Pre-screening** → **Proceed to peer review** → confirm
4. **Reviewer assignment** — select **reviewer@journal.com** (R1) and **reviewer2@journal.com** (R2)
5. **Send invitations** → confirm

**Status after:** `assigned` (until both reviewers accept)

---

### Step 4a — Reviewer 1 accepts and submits review

| | |
| --- | --- |
| **Email** | `reviewer@journal.com` |
| **Password** | `reviewer123` |

1. Open the submission
2. **Review invitation** → **Accept**
3. **Submit review** → open modal
4. Pick **Accept**, write comments, optional image attachments
5. **Submit review**

---

### Step 4b — Reviewer 2 accepts and submits review

| | |
| --- | --- |
| **Email** | `reviewer2@journal.com` |
| **Password** | `reviewer123` |

1. Open the submission
2. **Review invitation** → **Accept** (status moves to `under_review` once both accept)
3. **Submit review** → **Accept** + comments → **Submit review**

**Status after:** `under_review` (both reviews in → HE can decide)

---

### Step 5 — HE approves for publication

| | |
| --- | --- |
| **Email** | `editor@journal.com` |
| **Password** | `editor123` |

1. Open the submission → **Choose decision**
2. Pick **Approve**, optional comments/images → **Submit decision**
3. **Approve & request payment** → confirm

**Status after:** `payment_pending`

---

### Step 6 — Author pays APC *(production deployments only)*

> **Demo mode skips this step.** After HE approval, the manuscript moves to **accepted** and layout can start immediately.

| | |
| --- | --- |
| **Email** | `author@journal.com` |
| **Password** | `author123` |

1. Sidebar → **Payments** — tap the manuscript in the list
2. Upload transfer proof on the payment detail page (PDF or screenshot) + optional reference
3. **Submit proof**

**Status after:** payment `pending_review`

---

### Step 7 — Admin verifies payment *(production deployments only)*

| | |
| --- | --- |
| **Email** | `admin@journal.com` |
| **Password** | `admin123` |

1. Go to **Payments**
2. Open the pending proof → **Approve**

**Status after:** `production`

---

### Step 6 (demo) — HE layout and sends proof

Skip steps 6–7 above in demo. After Step 5 approval, continue here:

| | |
| --- | --- |
| **Email** | `editor@journal.com` |
| **Password** | `editor123` |

1. Open the submission → **Layout & Production**
2. **Start layout** → confirm
3. Upload a publication-ready file (PDF, DOCX, etc.) → **Upload** → confirm
4. **Send for author proof** → confirm
5. *(Optional)* Pick a publication date → **Schedule**

**Status after:** author sees proofreading panel

---

### Step 7 (demo) — Author approves proof

| | |
| --- | --- |
| **Email** | `author@journal.com` |
| **Password** | `author123` |

1. Open the submission
2. **Approve Proof** → confirm

**Status after:** ready for publisher to publish

---

### Step 8 (demo) — Admin publishes

| | |
| --- | --- |
| **Email** | `admin@journal.com` |
| **Password** | `admin123` |

1. Open the submission (or **Published** pipeline)
2. **Publish Now** → confirm

**Status after:** `published` ✓

---

## Quick reference — who logs in when

| Step | Email | Password | Action |
| --- | --- | --- | --- |
| 1 | `author@journal.com` | `author123` | Submit manuscript |
| 2 | `eic@journal.com` | `eic123` | Assign HE |
| 3 | `editor@journal.com` | `editor123` | Pre-screen + invite R1 & R2 |
| 4a | `reviewer@journal.com` | `reviewer123` | Accept + submit review |
| 4b | `reviewer2@journal.com` | `reviewer123` | Accept + submit review |
| 5 | `editor@journal.com` | `editor123` | Approve for publication |
| 6–7 | — | — | *(Demo skips APC — go to layout)* |
| 6 | `editor@journal.com` | `editor123` | Layout + send proof (demo) |
| 7 | `author@journal.com` | `author123` | Approve proof (demo) |
| 8 | `admin@journal.com` | `admin123` | Publish (demo) |

---

## Workflow rules (demo)

- **EIC** only assigns handling editors at intake — no final review decisions
- **Handling editor** owns pre-screening, reviewer assignment, editorial decisions, layout, and scheduling
- **Minimum two reviewers** before the handling editor can decide after peer review
- **Author revisions** return to the handling editor (no EiC approval loop) — skipped in happy path above
- **Submission is free** — no upfront author payment to submit
- **APC** applies only after editorial acceptance in production; **disabled in demo mode**
- **Publisher / Admin** verifies payment (production) and performs final publish
