# PRD: Cookaholics Meeting Intelligence

## 1. Problem Statement

Cookaholics heeft 4 afdelingen (Keuken, Sales, Marketing, MT) die samen ~64 meetings per maand houden. Momenteel:
- Worden actiepunten niet consistent vastgelegd
- Verdwijnen afspraken "in de mist"
- Heeft MT geen gestructureerd overzicht van wat er speelt
- Is er geen opvolging op openstaande taken
- Gaat waardevolle informatie uit gesprekken verloren

**Impact:** Besluiten worden vergeten, taken blijven liggen, MT stuurt blind.

---

## 2. Goal

Een AI-first meeting intelligence systeem dat:
1. Alle meetings automatisch transcribeert en samenvat
2. Actiepunten extraheert met eigenaar en deadline
3. Wekelijkse/maandelijkse rapportages genereert per afdeling
4. MT een helicopter-view geeft over de hele organisatie
5. Zorgt dat niets meer tussen wal en schip valt

---

## 3. Target User

**Primair:**
- Afdelingshoofden (4 personen) — beheren hun afdeling-meetings
- MT (6 personen) — ontvangen overzichten

**Secundair:**
- Alle medewerkers (15 personen) — zien hun eigen actiepunten

---

## 4. User Stories

### Als afdelingshoofd wil ik:
- [ ] Audio uploaden van een meeting en automatisch notulen ontvangen
- [ ] Alle meetings van mijn afdeling in een overzicht zien
- [ ] Openstaande actiepunten van mijn team zien
- [ ] Wekelijks een samenvatting ontvangen van wat er besproken is

### Als MT-lid wil ik:
- [ ] Een weekly digest ontvangen met highlights van alle afdelingen
- [ ] Rode vlaggen en escalaties direct zien
- [ ] Per afdeling kunnen inzoomen op details
- [ ] KPI's zien naast de meeting-inhoud

### Als medewerker wil ik:
- [ ] Mijn eigen actiepunten zien met deadlines
- [ ] Terug kunnen zoeken wat er besproken is over een onderwerp
- [ ] Herinnerd worden aan openstaande taken

---

## 5. Functional Requirements

### 5.1 Meeting Management

**Agenda View:**
- Kalender met alle geplande meetings
- Filter per afdeling, type (daily/weekly/monthly), cross-afdeling
- Meetings aanmaken met: type, afdeling(en), deelnemers, datum/tijd

**Meeting Types:**
| Type | Afdelingen | Frequentie | Duur |
|------|-----------|------------|------|
| Daily | Keuken, Sales, Marketing | Dagelijks | 5-15 min |
| Weekly | Keuken, Sales, Marketing | Wekelijks | 45-60 min |
| Monthly | Keuken, Sales, Marketing, MT | Maandelijks | 60-90 min |
| Quarterly | MT | Per kwartaal | Dagdeel |
| Cross: Marketing-Sales | Marketing + Sales | Wekelijks | 45-60 min |
| Cross: Keuken-Sales | Keuken + Sales | Wekelijks | 45-60 min |
| Cross: Projecten | Alle afdelingen | Wekelijks | 45-60 min |

### 5.2 Transcriptie & AI Processing

**Upload Flow:**
1. Gebruiker uploadt audio (mp3, m4a, wav)
2. Systeem transcribeert via Whisper API
3. AI genereert:
   - Samenvatting (max 5 bullets)
   - Besproken onderwerpen met timestamps
   - Actiepunten met: beschrijving, eigenaar, deadline
   - Besluiten die genomen zijn
   - Rode vlaggen / escalaties (indien van toepassing)

**Meeting Script Support:**
- Per meeting-type een standaard script/template
- Voorzitter opent met vaste structuur zodat AI beter kan parsen
- Voorbeeld: "We beginnen met de actiepunten van vorige week..."

### 5.3 Actiepunten Tracking

**Actiepunt bevat:**
- Beschrijving
- Eigenaar (persoon)
- Deadline
- Status: Open / In Progress / Done
- Bron: link naar meeting waar het uit kwam

**Automatische opvolging:**
- Bij volgende meeting: "Openstaande actiepunten sinds vorige keer"
- Daily reminder via email voor items met deadline vandaag/morgen
- Overzicht van overdue items

### 5.4 Rapportages

**Wekelijkse Afdeling Samenvatting (naar afdelingshoofd):**
- Alle meetings van die week
- Key decisions
- Nieuwe actiepunten
- Voltooide actiepunten
- Openstaande items

**Wekelijkse MT Digest (naar MT):**
- Per afdeling: 3-5 highlights
- Cross-afdeling thema's
- Rode vlaggen / escalaties
- Actiepunten die aandacht nodig hebben
- KPI snapshot (indien beschikbaar)

**Maandelijkse Rapportage:**
- Trends over de maand
- Voltooiingspercentage actiepunten
- Terugkerende thema's
- Aanbevelingen

### 5.5 Zoeken & Terugvinden

- Full-text search over alle transcripties
- Filter op: datum, afdeling, persoon, meeting-type
- "Wat hebben we besproken over [onderwerp]?"
- AI-powered: "Geef me alle besluiten over pricing van afgelopen maand"

---

## 6. Non-Goals (v1)

- Realtime transcriptie tijdens meeting
- Integraties met externe tools (Slack, Notion, etc.)
- KPI tracking / dashboard (metrics handmatig of later)
- Video opname / processing
- Automatische meeting scheduling
- Calendar sync (Google/Outlook)

---

## 7. Technical Considerations

### Tech Stack
| Component | Tool | Reden |
|-----------|------|-------|
| Framework | Next.js (Pages Router) | Cursus-standaard, proven |
| Database | Convex | Realtime, serverless |
| Auth | Clerk | Team management, rollen |
| Transcriptie | OpenAI Whisper API | Best voor Nederlands |
| AI Processing | Claude API | Beste voor samenvatting/extractie |
| Storage | Convex File Storage | Audio files |
| Email | Resend | Rapportages versturen |
| Hosting | Vercel | Auto-deploy |

### Data Model (basis)

```
Users
- id, name, email, department, role (admin/member)

Departments
- id, name (Keuken, Sales, Marketing, MT)

Meetings
- id, type, title, date, duration
- departments[] (kan meerdere zijn voor cross-afdeling)
- attendees[]
- audioFileId
- transcription
- summary
- status (scheduled/completed/processed)

ActionItems
- id, meetingId, description
- ownerId, deadline, status
- createdAt, completedAt

Decisions
- id, meetingId, description, context

Reports
- id, type (weekly/monthly), departmentId
- dateRange, content, sentAt
```

### API Costs Estimate (per maand)
- Whisper: ~64 meetings x 45 min avg = ~48 uur audio = ~$30
- Claude: ~64 summaries + reports = ~$20
- **Totaal: ~$50/maand**

---

## 8. Design Considerations

### Layout
- Sidebar: Afdelingen, Agenda, Actiepunten, Rapportages
- Main: Contextafhankelijk (kalender, meeting detail, etc.)
- Topbar: Search, user menu, notifications

### Key Screens
1. **Dashboard** — Vandaag's meetings, openstaande actiepunten, recente activiteit
2. **Agenda** — Kalender view met alle meetings
3. **Meeting Detail** — Audio player, transcriptie, samenvatting, actiepunten
4. **Actiepunten** — Lijst/kanban view, filters
5. **Rapportages** — Gegenereerde reports per week/maand
6. **Afdeling Overview** — Alles van één afdeling

### Mobile
- Responsive design (geen aparte app)
- Core flows moeten werken op telefoon (upload, actiepunten checken)

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Meetings met transcriptie | 100% binnen 2 maanden |
| Actiepunten completion rate | >80% |
| MT leest weekly digest | 100% |
| Time spent op notulen maken | -90% |
| "Wat spraken we ook alweer af?" vragen | -80% |

---

## 10. Rollout Plan

### Fase 1: Pilot Marketing (Week 1-2)
- Start met alleen Marketing afdeling
- Daily + Weekly meetings
- Valideer transcriptie kwaliteit
- Itereer op samenvatting format

### Fase 2: Sales toevoegen (Week 3-4)
- Sales meetings
- Marketing-Sales cross meeting
- Test actiepunten flow

### Fase 3: Keuken + Cross-afdelings (Week 5-6)
- Keuken meetings
- Keuken-Sales meeting
- Projecten meeting

### Fase 4: MT + Rapportages (Week 7-8)
- MT monthly meeting
- Weekly digests activeren
- Maandelijkse rapportages

---

## 11. Beslissingen (voorheen Open Questions)

1. **Rollen & permissies:** Iedereen ziet alleen eigen afdeling. MT ziet alles.
2. **Aanwezigheid:** Handmatig invullen bij meeting aanmaken/afsluiten.
3. **Meeting scripts:** Admin (Nick) maakt de standaard scripts per meeting-type.
4. **KPI's voor MT:** Openstaande actiepunten per afdeling (aantal, overdue, completion rate).
5. **Retentie:** Audio files 1 jaar bewaren, daarna automatisch verwijderen.
6. **Escalatie detectie:** AI scant op onderstaande rode vlag triggers.

### Rode Vlag Triggers (voor AI detectie)

**Urgentie woorden:**
- urgent, spoed, kritiek, kritisch, deadline gemist
- ASAP, zo snel mogelijk, vandaag nog, moet nu

**Probleem indicatoren:**
- probleem, issue, blocker, vastgelopen, stuck
- werkt niet, kapot, fout, error, bug
- klacht, ontevreden, boos, gefrustreerd

**Resource issues:**
- te weinig mensen, onderbezet, overbelast
- budget op, te duur, geen geld voor
- geen tijd, niet haalbaar, niet realistisch

**Klant/omzet gerelateerd:**
- klant verloren, annulering, opzegging
- omzet daalt, minder boekingen, geen leads
- concurrent, marktaandeel

**Team/HR gerelateerd:**
- ontslag, opzeggen, vertrek, ziekmelding
- conflict, ruzie, onenigheid
- demotivatie, burn-out, stress

**Escalatie expliciet:**
- escaleren, MT moet weten, directie informeren
- hulp nodig, kunnen dit niet alleen
- beslissing nodig van, goedkeuring nodig

---

## 12. Tech Stack Tag

```
For the tech stack we will use Next.js with Pages Router, 
Convex for database and file storage, Clerk for auth with 
team/department roles. For AI we use OpenAI Whisper API for 
transcription and Claude API for summarization and extraction.
We use Resend for email delivery of reports.
We are going to use Tailwind v3 and shadcn for design.
```
