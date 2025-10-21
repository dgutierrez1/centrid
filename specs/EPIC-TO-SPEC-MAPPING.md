# Epic to Spec Mapping

**Purpose:** Bridge epic-based requirements to Speckit feature-driven development

**Source Documents:**
- [COMPLETE-SYSTEM-REQUIREMENTS.md](../specs-old/COMPLETE-SYSTEM-REQUIREMENTS.md)
- [00-MASTER-IMPLEMENTATION-PLAN.md](../specs-old/implementation-plan/00-MASTER-IMPLEMENTATION-PLAN.md)

**Workflow:** Each epic → Multiple feature specs → Design → Tasks → Implementation

---

## MVP Feature Breakdown (7-Day Target)

### **Epic 1: Document Upload & Processing**

**From Requirements:** Journey 2, Section "Multi-Format File Processing"

**Feature Specs:**

#### **001-document-upload**
- **User Stories:**
  - P1: Upload .md, .txt, .pdf files via drag-and-drop
  - P2: View upload progress with status indicators
  - P3: Handle upload failures with retry
- **Scope:** File validation, upload to Supabase Storage, basic UI
- **Dependencies:** None (foundational)
- **Design needs:** Upload zone, progress bars, error states
- **Time:** 1 day

#### **002-document-processing**
- **User Stories:**
  - P1: Extract text from uploaded documents
  - P2: Generate vector embeddings (pgvector)
  - P3: Store searchable chunks in database
- **Scope:** Edge Function for processing, status tracking
- **Dependencies:** 001-document-upload
- **Design needs:** Processing status UI
- **Time:** 1.5 days

---

### **Epic 2: Multi-Chat System with RAG**

**From Requirements:** Journey 3, Section "AI Chat System Requirements"

**Feature Specs:**

#### **003-chat-creation**
- **User Stories:**
  - P1: Create new chat threads
  - P2: View list of all chats
  - P3: Switch between chats
- **Scope:** Chat CRUD, sidebar UI, real-time sync
- **Dependencies:** None (can develop in parallel with documents)
- **Design needs:** Chat list sidebar, empty states, chat cards
- **Time:** 0.75 days

#### **004-rag-chat-interface**
- **User Stories:**
  - P1: Send message and receive AI response
  - P2: View streaming responses in real-time
  - P3: See which documents informed response (citations)
- **Scope:** Message UI, Claude integration, RAG context retrieval
- **Dependencies:** 002-document-processing, 003-chat-creation
- **Design needs:** Message bubbles, typing indicators, citation UI
- **Time:** 2 days

#### **005-persistent-context**
- **User Stories:**
  - P1: All chats access same document library
  - P2: Context retrieved automatically per message
  - P3: Citations link to source documents
- **Scope:** Context assembly, relevance ranking, citation tracking
- **Dependencies:** 002-document-processing, 004-rag-chat-interface
- **Design needs:** Context preview panel, citation cards
- **Time:** 1.5 days

---

### **Epic 3: Document Management**

**From Requirements:** Journey 4, Section "Document Management & Organization"

**Feature Specs:**

#### **006-document-library** (Post-MVP Week 2)
- **User Stories:**
  - P1: View all uploaded documents
  - P2: Search documents by name/content
  - P3: Rename and delete documents
- **Scope:** Document list UI, search, CRUD operations
- **Dependencies:** 001-document-upload
- **Design needs:** Document grid/list, search bar, action menus
- **Time:** 1 day

---

### **Epic 4: Authentication & Billing**

**From Requirements:** Journey 1, Section "Account Management"

**Feature Specs:**

#### **007-authentication** (MVP - Basic Only)
- **User Stories:**
  - P1: Sign up with email/password
  - P2: Email verification
  - P3: Login and session management
- **Scope:** Supabase Auth integration, basic UI
- **Dependencies:** None
- **Design needs:** Login/signup forms, email verification screen
- **Time:** 0.5 days

#### **008-billing-integration** (Post-MVP Week 2)
- **User Stories:**
  - P1: 7-day free trial (no credit card)
  - P2: Upgrade to $25/month plan
  - P3: View usage and billing
- **Scope:** Stripe integration, usage tracking UI
- **Dependencies:** 007-authentication
- **Design needs:** Pricing page, billing dashboard
- **Time:** 1.5 days

---

## Implementation Order (MVP First 7 Days)

**Week 1 (MVP Core):**
```
Day 0: Design system setup (/speckit.design-system)
Day 1: 001-document-upload
Day 2: 002-document-processing
Day 3: 003-chat-creation + 007-authentication (basic)
Day 4-5: 004-rag-chat-interface
Day 6-7: 005-persistent-context
```

**Week 2 (Enhanced MVP):**
```
Day 8: 006-document-library
Day 9-10: 008-billing-integration
Day 11-12: Polish, testing, deployment
```

---

## Feature Spec Workflow

For each feature above:

### **1. Create Specification**
```bash
/speckit.specify "[Feature description from user story P1]"
```

**Input:** User stories from this mapping doc
**Output:** `specs/[NNN]-[feature-name]/spec.md`
**Time:** 15-30 minutes

### **2. Generate Implementation Plan**
```bash
/speckit.plan
```

**Input:** Approved spec.md
**Output:** `specs/[NNN]-[feature-name]/plan.md` (architecture, tech stack)
**Time:** 20-40 minutes

### **3. Visual Design (NEW STEP)**
```bash
/speckit.design
```

**Input:** spec.md + plan.md
**Output:** `specs/[NNN]-[feature-name]/design/` with screenshots
**Time:** 30-60 minutes (with iteration)

### **4. Generate Tasks**
```bash
/speckit.tasks
```

**Input:** spec.md + plan.md + design/
**Output:** `specs/[NNN]-[feature-name]/tasks.md` (implementation checklist)
**Time:** 10-20 minutes

### **5. Implement**
```bash
/speckit.implement
```

**Input:** All above artifacts
**Output:** Working code in `apps/web/src/`
**Time:** Varies (see mapping above)

---

## How This Preserves Your Requirements

### **User Journeys → User Stories**
- Journey 1 (Onboarding) → 007-authentication + 001-document-upload
- Journey 2 (Document Upload) → 001-document-upload + 002-document-processing
- Journey 3 (Multi-Chat) → 003-chat-creation + 004-rag-chat-interface + 005-persistent-context
- Journey 4 (Document Management) → 006-document-library

### **System Requirements → Constitution + Plan**
- "Multi-Chat System" → Enforced in constitution (Principle III)
- "RAG with pgvector" → Enforced in constitution (Principle III)
- "Supabase Stack" → Enforced in constitution (Principle IV)
- "Real-time Updates" → Enforced in constitution (Principle VI)

### **Implementation Phases → Feature Dependencies**
- Phase 1 (Backend) → 001, 002, 007 (foundational features)
- Phase 2 (AI Intelligence) → 004, 005 (depends on 002)
- Phase 3 (Frontend) → Design layer + implementation
- Phase 4 (Deployment) → Handled post-tasks

---

## Advantages of This Approach

✅ **Preserves big picture:** Epic mapping ensures no requirements lost
✅ **Enables iteration:** Each feature is independently specifiable and testable
✅ **Visual validation:** Design step catches UX issues before implementation
✅ **Parallel development:** Independent features can be built simultaneously
✅ **Clear progress:** Feature completion = visible value delivered
✅ **Flexible ordering:** Reprioritize features based on feedback without rewriting plan

---

## Next Steps

1. **Review this mapping** - Adjust feature breakdown if needed
2. **Run `/speckit.design-system`** - Lock global visual foundation
3. **Start with 001-document-upload:**
   ```bash
   /speckit.specify "Enable users to upload markdown, text, and PDF files via drag-and-drop interface with progress indicators and error handling"
   ```
4. **Follow spec → plan → design → tasks → implement for each feature**
5. **Track progress** - Check off features as completed

---

**Status:** Draft - Ready for Review
**Last Updated:** 2025-10-21
