# Business Agent Workflow Setup for Antigravity

## Overview

This document covers setting up the **Business Plan Agent** in Google Antigravity for the Circus Video Archive project. The first task is competitive research on the existing FSU Flying High Circus digital presence.

---

## Workflow File

**Location:** `.agent/workflows/business-plan.md`

```markdown
---
description: Research, analyze, and develop business documentation for the Circus Video Archive proposal
---

## Business Agent Role

You are the Business Plan Agent for the Circus Video Archive project. Your focus is developing compelling documentation to present this platform as a formal proposal to FSU Flying High Circus leadership.

### Your Deliverables

1. Competitive analysis of existing circus digital presence
2. Gap analysis (what's missing that our platform provides)
3. Executive summary (one-pager for leadership)
4. Value proposition document
5. Implementation roadmap with cost estimates
6. ROI analysis for the organization

---

## Task: Competitive Research

When asked to research the FSU Flying High Circus digital presence, follow these steps:

### Step 1: Analyze Official FSU Circus Website

Visit and document the following pages on circus.fsu.edu:

1. **Homepage** (circus.fsu.edu)
   - Note: What content is featured?
   - Is there any video content?
   - How is history/archives presented?

2. **About Us** (circus.fsu.edu/about-us)
   - Document the history presented
   - Note any mention of institutional knowledge preservation

3. **Performances** (circus.fsu.edu/performances)
   - What show information is available?
   - Any historical performance records?

4. **Students** (circus.fsu.edu/students)
   - How are current/past performers documented?
   - Any alumni connections?

5. **75th Anniversary** (circus.fsu.edu/75)
   - Document any archive initiatives
   - Note the Oral History Project

6. **Oral History Project** (circus.fsu.edu/oralhistory)
   - Understand their current preservation efforts
   - Identify gaps our platform could fill

### Step 2: Analyze Alumni Website

Visit fsucircusalumni.com:

1. Document current features and functionality
2. Note how alumni are connected
3. Identify any video or media archives
4. Look for gaps in historical preservation

### Step 3: Research University Archives

Check these FSU archive sources:

1. **DigiNole** (diginole.lib.fsu.edu) - FSU Digital Library
   - Search for Flying High Circus collections
   - Document what historical materials exist

2. **FSU Archives** (archives.lib.fsu.edu)
   - Note the Alumni Association Flying High Circus Collection
   - Document available historical records

3. **Florida Memory** (floridamemory.com)
   - Search for FSU Circus photos/records
   - Note what's publicly accessible

### Step 4: Check Social Media Presence

Document current social media:
- Instagram: @fsuflyinghighcircus
- Facebook: FSU Flying High Circus
- YouTube: Search for official channels

Note:
- How much video content exists?
- Is it organized or searchable?
- Can alumni easily find old performances?

### Step 5: Compile Gap Analysis

Create a document identifying:

| Current State | Gap | Our Solution |
|--------------|-----|--------------|
| Oral History Project exists | Audio/text only, no video integration | Video archive with searchable metadata |
| Photos in university archives | Not easily accessible to alumni | Community-driven platform with easy access |
| No centralized video archive | Performance videos scattered across personal collections | YouTube-based archive organized by year/act |
| 75+ years of history | Institutional knowledge lost after disruptions | Preserved and searchable by the community |
| Alumni website exists | Limited interactivity, no video | Voting, comments, performer tagging |

### Output Location

Save all research and analysis to:
- `/docs/business/COMPETITIVE_ANALYSIS.md`
- `/docs/business/GAP_ANALYSIS.md`

---

## Key Talking Points for Proposal

Use these themes throughout business documentation:

### 1. Knowledge Preservation Crisis
- The tornado damaged the Big Top and caused multi-year disruption
- Significant institutional knowledge was lost
- Your platform recaptures and preserves this for future generations

### 2. Low Cost, High Value
- YouTube hosts all videos (free)
- Minimal infrastructure costs
- Alumni-driven content contribution
- No ongoing content creation costs

### 3. Community Engagement
- Connects alumni across generations
- Voting system recognizes excellence
- Comments preserve stories and context
- Performer tagging builds connections

### 4. Complements Existing Efforts
- Works alongside the Oral History Project
- Adds video dimension to preservation
- Doesn't replace official channels, enhances them

### 5. Unique Institutional Asset
- One of only two collegiate circuses in the US
- 75+ years of history worth preserving
- Creates lasting legacy for future students

---

## Research Commands

When conducting web research, use these approaches:

1. **Browser research** - Use Antigravity's browser integration to visit and analyze websites
2. **Document findings** - Create markdown files in /docs/business/
3. **Screenshot evidence** - Capture relevant screenshots as artifacts

// turbo
Run `mkdir -p docs/business` to ensure output directory exists

---

## Document Templates

### Executive Summary Template

```markdown
# Circus Video Archive: Executive Summary

## The Opportunity
[One paragraph on the problem and solution]

## Why Now
[Reference tornado disruption, 75th anniversary momentum, knowledge loss]

## What We're Proposing
[Brief platform description]

## Investment Required
[Minimal - YouTube hosting, volunteer development]

## Expected Outcomes
[Community engagement, knowledge preservation, alumni connection]

## Next Steps
[Pilot program, data gathering, leadership presentation]
```

### Value Proposition Template

```markdown
# Value Proposition

## For Alumni
- Rediscover performances from their era
- Connect with fellow performers across generations
- Preserve their contributions to circus history

## For Current Students
- Learn from historical performances
- Understand the evolution of each act
- Connect with alumni mentors

## For the Organization
- Preserve 75+ years of institutional knowledge
- Strengthen alumni engagement and giving
- Create unique recruiting tool for prospective students
- Document excellence for posterity

## For the Community
- Access to Tallahassee's cultural heritage
- Educational resource about circus arts
- Celebration of FSU tradition
```

---

## Workflow Triggers

This workflow activates when you:
- Type `/business-plan` in chat
- Ask about "competitive analysis" or "research existing circus websites"
- Request help with "proposal" or "business documentation"
- Ask to "analyze the FSU circus digital presence"
```

---

## Initial Research Findings (From Web Search)

Based on my research, here's what currently exists in the FSU Flying High Circus digital landscape:

### Official Website (circus.fsu.edu)

**What exists:**
- Basic information pages (About, Performances, Students, Ticketing)
- 75th Anniversary celebration page with event listings
- Oral History Project page (audio/text interviews with alumni)
- News about returning to full operations after tornado disruption for 2025-2026

**Key quote from their site:** "After a very long and challenging year without the big top tent, the circus prepares to return to full operations this fall."

**Gaps identified:**
- No searchable video archive
- No way to browse historical performances
- Limited alumni engagement features
- Performance history not organized by year/act

### Alumni Website (fsucircusalumni.com)

**What exists:**
- Basic alumni profiles with "favorite memories"
- Contact information for alumni association
- Connection to Oral History Project

**Gaps identified:**
- No video content
- No way to search or browse performances
- Limited interactivity
- No voting or recognition system

### University Archives

**What exists:**
- DigiNole has some digitized circus records (programs from 1959, etc.)
- FSU Archives has physical collections (photos, programs, documents)
- Florida Memory has some historical photos
- Alumni Association Flying High Circus Collection exists

**Gaps identified:**
- Scattered across multiple systems
- Not easily accessible to general alumni
- Focused on documents/photos, not video
- No community contribution mechanism

### Oral History Project

**What exists:**
- Audio/text interviews with alumni
- Run by volunteers (alumni who "do it purely for the fun of it")
- Connected to 75th anniversary celebration

**Opportunity:**
- Your video archive complements this perfectly
- Video adds dimension that audio alone can't capture
- Same volunteer-driven model could work for video collection

### Social Media

**What exists:**
- Active Instagram and Facebook presence
- Some video content posted
- Current show promotion focus

**Gaps identified:**
- Not organized as searchable archive
- Historical content gets buried
- No way to find specific years/acts/performers

---

## Your Value Proposition Summary

| They Have | You Add |
|-----------|---------|
| Oral histories (audio) | Video archive |
| Static photos in archives | Searchable, browsable collection |
| Current show promotion | Historical preservation |
| Alumni profiles | Community voting and recognition |
| Scattered records | Centralized, organized platform |

---

## Suggested First Task for Business Agent

Once you set up this workflow in Antigravity, try this prompt:

> "Research the current FSU Flying High Circus digital presence. Visit their official website, alumni site, and document what video/archive capabilities they currently have. Create a competitive analysis document identifying gaps that our Circus Video Archive could fill."

The agent will use browser integration to visit the sites, analyze them, and create documentation in `/docs/business/`.

---

## File to Create

Copy this workflow file to your project:

**Path:** `.agent/workflows/business-plan.md`

The content between the first set of triple backticks above (starting with `---` and `description:`) is what goes in that file.
