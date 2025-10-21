# First Dollar Playbook

**Goal**: Get ONE paying customer in 14 days or less
**Strategy**: Find 50 people with the pain, show them it works, get one to pay
**Mindset**: Someone pays → Product validated → Build from there

---

## The Strategy in One Sentence

Find 50 people who have the exact pain you're solving, show them the product works, ask them to pay $19 (or $10 for first month), and get at least ONE to say yes.

---

## Prerequisites Checklist

### Must Have

**Product**:
- [ ] Working MVP deployed and accessible
- [ ] User signup (email + password)
- [ ] User can upload 3-5 markdown files
- [ ] AI agent can create ONE document using uploaded context
- [ ] AI agent can edit selected text
- [ ] User can view/download created documents
- [ ] Works on mobile browser (doesn't have to be perfect)
- [ ] No critical bugs blocking core workflow

**Payment**:
- [ ] Stripe account set up and verified
- [ ] Can generate payment links manually (Stripe Payment Links)
- [ ] Can manually grant access after payment
- [ ] Simple tracking (spreadsheet is fine)

**Demo**:
- [ ] 90-second Loom video showing product working
  - Shows the pain (copying to ChatGPT, slow Obsidian mobile)
  - Shows the solution (upload → create → result)
  - Shows the value (2 minutes vs 2 hours)
  - Clear call-to-action at end
- [ ] 3-5 sample markdown files for demo
- [ ] One impressive example output

**Communication**:
- [ ] Professional email (you@centrid.ai)
- [ ] Twitter account (even if 0 followers)
- [ ] LinkedIn profile updated
- [ ] Calendar booking link (Calendly free)
- [ ] Phone number willing to give prospects

**Tracking**:
- [ ] Google Sheet prospect tracking template (see below)

### Nice to Have (Not Blocking)
- Landing page (can send Loom + payment link instead)
- Perfect mobile experience (just needs to work)
- Email automation (do manually for first customers)

---

## Prospect Tracking Template

Create this Google Sheet NOW:

```
| # | Name | Platform | Profile URL | Pain Point | Date | Status | Response | Payment | Notes |
|---|------|----------|-------------|------------|------|--------|----------|---------|-------|
```

**Status Options**: Not Contacted, Sent DM, Responded, Demo Scheduled, Demo Done, Interested, Paid, Not Interested, No Response

This is your command center. Update after every interaction.

---

## Day-by-Day Execution

### Days 1-2: Build Hit List (50 Prospects)

**Goal**: Find 50 people who EXPLICITLY mentioned the pain in last 30 days

#### Where to Find Them

**1. Twitter Search (Target: 15 prospects)**

Search these phrases:
- "Obsidian mobile sucks"
- "Notion too slow"
- "markdown editor mobile"
- "ChatGPT context switching"
- "copying to ChatGPT"

How to do it:
1. Twitter search: `"Obsidian mobile" filter:replies`
2. Click "Latest" (last 30 days)
3. Check profile: Technical? Creates content?
4. Add to spreadsheet with EXACT pain quote

**Quality Check**:
- Must mention specific pain in last 30 days
- Profile indicates indie dev, writer, or PM
- 50+ followers (real person)
- Active (posted in last week)

**2. Reddit Scraping (Target: 20 prospects)**

**Subreddits**:
- r/ObsidianMD
- r/productivity
- r/markdown
- r/SideProject
- r/developertools

**Search**: "mobile", "AI writing", "documentation workflow"
- Filter by "Posts" and "Past Month"
- Find people expressing pain
- Check profile: Active? Technical?
- Add to spreadsheet with post link

**Red flags (skip)**:
- Account < 1 month old
- No post history
- Only promotional content

**3. LinkedIn (Target: 10 prospects)**

**Search**: "Technical Writer", "Developer Advocate", "Documentation Engineer", "Product Manager"
- Filter: 2nd degree connections
- Look at recent posts
- Add to spreadsheet with LinkedIn URL

**4. Indie Hackers (Target: 5 prospects)**

- Recent posts in "Share Your Product"
- Building in public = lots of documentation
- Add with link to their post

#### Prospect Tiers

**A-Tier (Priority 1)**: 20 prospects
- Mentioned EXACT pain in last 7 days
- Technical background
- Active, building something
- Reachable

**B-Tier (Priority 2)**: 20 prospects
- Related pain in last 30 days
- Technical background
- Active but less frequent

**C-Tier (Priority 3)**: 10 prospects
- General frustration with tools
- Less technical
- Older mention (30+ days)

**Day 2 Checkpoint**:
- [ ] 50 prospects in spreadsheet
- [ ] Each has specific pain point noted
- [ ] All from last 30 days
- [ ] Prioritized A/B/C tiers

---

### Days 3-5: Outreach Wave 1 (20 Prospects)

**Goal**: Contact 20 A-tier prospects, get 5+ responses, schedule 2+ demos

#### The Outreach Formula

```
Personalization (shows you're not spamming)
    ↓
Quick pitch (what you built)
    ↓
Specific ask (try it for $10-19)
    ↓
Remove friction (Loom, money-back guarantee)
    ↓
Clear next step
```

#### Platform Templates

**TWITTER DM**:
```
Hey [Name],

Saw your tweet about [specific pain quote]. I literally built something for this.

Centrid - AI agents for markdown files. Like Cursor but for documents.
Works on mobile, understands your entire knowledge base.

Try it for $10 first month? Money-back guarantee if it doesn't save hours.

90-second demo: [Loom link]

Worth a shot?
- [Your name]
```

**Why this works**:
- Opens with their pain (proves you read it)
- One-sentence pitch with comparison (Cursor)
- Low-friction ($10, not $19)
- Risk reversal (money-back)
- Shows product immediately
- Short (20 seconds to read)

**REDDIT DM**:
```
Subject: Built something for [specific pain]

Hey [Username],

Saw your post in r/[subreddit] about [pain]. Built Centrid for this exact problem.

Mobile-first AI workspace for markdown. AI agents understand your knowledge base,
create/edit documents, works anywhere.

Launching this week. $10 first month, then $19. Money-back guarantee.

Demo (90 sec): [Loom link]

Interested? Reply or email: [your email]

- [Name]
```

**LINKEDIN MESSAGE**:
```
Hi [Name],

I saw you're a [job title] at [company]. Building Centrid - AI workspace
for technical documentation.

Built it because I was tired of copying markdown to ChatGPT and Obsidian's
mobile being unusable.

Looking for 10 early users. Interested? $10 first month to test.

Demo: [Loom link]
Happy to jump on quick call: [Calendly]

Best,
[Your name]
```

**INDIE HACKERS COMMENT**:
```
Hey [Name], love what you're building!

Working on Centrid - AI agents for markdown/docs. Built it because building
in public = TON of documentation.

Just launched. First 10 IH users get lifetime 50% off ($9.50/month).

Demo: [Loom link]

Would love your feedback!
```

#### Execution Schedule

**Day 3 Morning**:
- Send 10 DMs to A-tier Twitter prospects
- Send 5 DMs to A-tier Reddit prospects

**Day 3 Evening**:
- Check responses
- Reply within 1 hour to anyone who responds

**Day 4 Morning**:
- Send 5 LinkedIn messages

**Day 4 Afternoon**:
- Follow up on Day 3 non-responders (48 hours later)
- Follow-up: "Hey, curious if you saw this? No worries if not interested!"

**Day 5**:
- Check all responses
- Schedule demos
- Update spreadsheet

#### Response Handling

**"Sounds interesting, tell me more"**:
```
Awesome! Quick version:
1. Upload markdown files
2. AI agents understand ALL your content
3. Create/edit docs, research across files
4. Works on mobile (PWA)

Best way: [Loom demo]

Try it? $10 first month. Or 15-min call: [Calendly]
```

**"How is this different from [competitor]?"**:
```
Great question!

vs Obsidian: Mobile-first + AI agents (not just search)
vs Notion: Fast, markdown-native, AI understands context
vs ChatGPT: Lives IN your docs, remembers everything

Try it 10 days. If not 10x better, immediate refund.

Demo: [Loom]
```

**"Looks cool but not sure I need this"**:
```
Totally fair! What's your current workflow for [notes/docs]?

Still learning who this is perfect for. Your feedback helps.

(If you DO try it: first 2 months $10 total as thanks)
```

**"Price seems high"**:
```
I hear you. My thinking:

5+ docs/week, saves 30 min each = 10 hours/month saved.
At any rate, that's $100-500+ saved for $19/month.

But you don't know yet if it'll save that time.

How about: $5 first month. Try it. Not worth it? Cancel, I'll refund.

Deal?
```

**"Can I try free first?"**:
```
Don't have free trials set up yet (bootstrapping solo 😅)

But: $10 first month, after one week if not worth it, full refund.

Basically free trial with returnable $10 deposit.

Work for you?
```

**Day 5 Checkpoint**:
- [ ] 20 outreach messages sent
- [ ] At least 5 responses (if not, refine messaging)
- [ ] 2+ people interested
- [ ] 1+ demo scheduled or payment link sent

---

### Days 6-8: Demos & Closing

**Goal**: Convert interested prospects to paying customers

#### Demo Call Structure (15 min max)

**Minutes 0-2: Rapport**
```
"Hey [Name], thanks for hopping on!

Tell me: what's your current setup for [notes/docs]? What's frustrating?"
```
_Listen. Take notes._

**Minutes 2-5: Tailored Demo**

Show ONLY what solves THEIR pain:

**If "Obsidian mobile terrible"**:
- Open on phone
- Show smooth mobile experience
- Show AI creating document on mobile

**If "ChatGPT context switching"**:
- Show uploading documents
- Show AI using context from ALL documents
- "No more copying context"

**If "writing docs takes forever"**:
- Show before: blank
- Show after: full document in 30 seconds

**Minutes 5-12: Let Them Drive**
```
"Want to see anything specific? Or try it yourself?"
```
- Share screen control
- Watch where they struggle
- Answer questions

**Minutes 12-15: Close**
```
"So, what do you think? Does this solve [their pain]?"
```
_Wait. Don't fill silence._

**If positive**:
```
"Awesome! Want to start today?

$19/month but I'll do $10 first month (early user).

I can send payment link now, get you set up in 5 minutes."
```

**If hesitant**:
```
"What would you need to see to feel confident?

[Address concern]

How about: $10 first month, use 2 weeks, if doesn't save time
I'll refund immediately. Risk-free trial.

Fair?"
```

**If no**:
```
"No worries! What's the main thing holding you back?

[Listen - this is gold]

Thanks so much for your time. Seriously helpful.

If you change your mind: [link]"
```

#### Closing Without Demo Call

**After they watch Loom**:
```
Glad it resonates! Want to start?

Quick version:
- $19/month (I'll do $10 first month)
- Cancel anytime
- Money-back guarantee

Payment: [Stripe link]

After you pay, login details within 30 min.

Questions?
```

#### Payment & Onboarding

**When someone pays**:

**1. Immediate confirmation (15 min)**:
```
[Name], got your payment - thanks!

Setting up account now. Login details in 15 min.

Quick question: what's the first thing you want to try?
(helps me personalize setup)
```

**2. Send login (30 min)**:
```
You're all set!

Login: [URL]
Username: [email]
Password: [temp password]

First steps:
1. Log in, change password
2. Upload 3-5 markdown files
3. Try: "Create a summary of all my documents"

I'm here if stuck - reply or text: [phone]

Let me know what you think!
```

**3. Check-ins**:
- 24hr: "Have you tried uploading docs and using AI?"
- 48hr: "How's it going? Created anything useful?"
- 7-day: "Week 1 - what do you think? Worth $19/month?"

**Day 8 Checkpoint**:
- [ ] Completed 2+ demos
- [ ] Sent payment links to interested prospects
- [ ] At least 1 person PAID (if not, continue)
- [ ] If paid: customer onboarded and actively using

---

### Days 9-10: Outreach Wave 2 (30 Prospects)

**Goal**: Expand reach, improve messaging based on learnings

#### Analyze Wave 1

```
| Metric | Result | Insight |
|--------|--------|---------|
| Messages sent | 20 | - |
| Response rate | X% | If <25%, messaging needs work |
| Demos | X | If <2, offer unclear |
| Objections | [list] | Address in Wave 2 |
| Payments | X | If 0, pricing or trust issue |
```

#### Refine Messaging

**If "too expensive"**:
- Lower to $5 first month
- Add time-saving calculation
- Emphasize refund more

**If "not sure I need this"**:
- Target MORE explicit pain
- Add before/after to demo
- Show ROI calculation

**If "seems complicated"**:
- Simplify demo (ONE use case)
- Add "5 minutes to set up"
- Offer setup call

**If "want to think about it"**:
- Add urgency: "First 20 users: lifetime 50% off"
- Add scarcity: "Only 10 more spots this month"
- Add proof: "3 people started this week"

#### Send Wave 2

- Day 9: 15 messages to B-tier
- Day 10: 15 messages to B/C-tier
- Use refined messaging

**Day 10 Checkpoint**:
- [ ] 30 more messages (50 total)
- [ ] Messaging refined
- [ ] 2-3 more demos scheduled
- [ ] 1+ payment received

---

### Days 11-14: Closing & Iteration

**Goal**: Close first customer if haven't already, understand what works

#### If You Have First Customer

**🎉 CONGRATULATIONS!**

**Now**:

1. **Get them using it**:
   - Daily check-ins first 3 days
   - Ask for feedback constantly
   - Fix bugs immediately
   - Document what features they use

2. **Get testimonial**:
```
[Name], thanks for being first customer!

Would you write 2-3 sentences about:
- What pain Centrid solved
- How it changed your workflow
- Would you recommend it

I'll use on website to help others.

As thanks: Free lifetime Pro (save $228/year)
```

3. **Ask for referrals**:
```
[Name], loving that you're getting value!

Know anyone else struggling with [pain]?

If you refer someone who pays:
- You: 1 month free
- Them: 1 month 50% off

Just have them mention your name.
```

4. **Analyze what made them convert**:
   - Which message did they respond to?
   - What platform?
   - What pain resonated?
   - What feature excited them?
   - Time from contact to payment?

**Document this** - template for next 10 customers.

#### If You DON'T Have First Customer

**DEEP DIVE**:

**1. Outreach Quality**:
- Did I send 50 messages? (target: 50)
- Response rate? (target: >20%)
- Did I personalize each?
- Did I follow up?

**2. Offer Quality**:
- Did people watch demo? (If no: demo not compelling)
- Understand what it does? (If no: messaging unclear)
- Think it saves time? (If no: wrong audience)
- Think worth price? (If no: pricing issue)

**3. Product Quality**:
- Could people USE it?
- Did it work as advertised?
- Did it solve their pain?
- Buggy or confusing?

**4. Trust Quality**:
- Did I seem legit?
- Respond quickly?
- Helpful not pushy?
- Offer refunds?

#### The Pivot Decision Tree

```
Did you send 50+ personalized messages?
    ↓
  Yes → Got 10+ responses?
          ↓
        Yes → 3+ watched demo?
                ↓
              Yes → 2+ interested?
                      ↓
                    Yes → Anyone pay?
                            ↓
                          No → PRICE ISSUE
                               Lower to $5
                    No → VALUE PROP ISSUE
                         Redo demo (ONE wow moment)
              No → DEMO QUALITY
                   Video too long (60 sec max)
        No → AUDIENCE ISSUE
             Target MORE explicit pain (last 7 days)
  No → EFFORT ISSUE
       Send 50 messages by end of week
```

#### Emergency Measures (Day 14, no customers)

**Option 1: Super Low Friction**
```
Free 30 days, then $19/month.
No credit card.
DM me your email, I'll set up in 5 min.
```

**Option 2: Insanely Low Price**
```
$1 first month.
Just want to validate with real users.
```

**Option 3: Pay-What-You-Want**
```
Pay what you think it's worth after 2 weeks.
Seriously.
Just need to know if this solves real problems.
```

**One of these will get someone to try.** Goal is validation, not revenue yet.

**Day 14 Checkpoint**:
- [ ] At least 1 paying customer (ANY amount)
- [ ] Understanding of what messaging works
- [ ] Understanding of what features matter
- [ ] List of improvements needed
- [ ] Decision: Proceed to Stage 2 or Pivot

---

## Success Criteria

### Minimum Success (Proceed to Stage 2)

- ✅ 1 paying customer (any price)
- ✅ Customer actively using product
- ✅ Customer says it solves pain
- ✅ You know WHERE you found them
- ✅ You know WHAT messaging worked
- ✅ You know WHAT features they care about

### Great Success

- ✅ 3-5 paying customers
- ✅ All from same channel (repeatable)
- ✅ All mentioned same pain (focused ICP)
- ✅ Using 2-3 times per week
- ✅ Willing to refer others
- ✅ Clear pricing ceiling

### Warning Signs (Consider Pivot)

- ❌ 0 customers after 50+ attempts
- ❌ Lots of interest but no one pays (ANY price)
- ❌ Pay but don't use
- ❌ Use once, never return
- ❌ Can't articulate why someone should care

---

## Building in Public Strategy

### Why Build in Public

Your target audience (indie devs, technical writers) LOVES building in public.

**Time Allocation**:
- 80% doing work (outreach, demos)
- 20% documenting work (building in public)

### What to Share

**✅ SHARE**:
- Actual metrics (messages, response rates, conversions)
- Specific learnings ("Changed pitch X to Y, 10% → 25% response")
- Tactical playbooks (exact templates that worked)
- Honest struggles ("No customers after 30 messages. Trying...")
- Customer wins ("First customer! They said [quote]")

**❌ DON'T SHARE**:
- Vanity metrics ("Built landing page!" with no customers)
- Vague updates ("Working hard!")
- Long blog posts (time sink)

### Daily Micro-Updates (3 min)

**Format**:
```
[Metric] + [Learning] + [Next Action]

Example:
"Sent 10 DMs today.
Learned: 'Cursor for docs' gets 2x more responses than 'AI workspace'
Tomorrow: Rewriting templates with this positioning."
```

**When**: End of workday

### Weekly Deep Dive (30 min)

**Template**:
```
Week [X] Building Centrid:

📊 METRICS:
- Messages: X
- Response rate: X%
- Demos: X
- Customers: X
- MRR: $X

💡 LEARNINGS:
- [Specific insight with example]

🎯 NEXT WEEK:
- [Concrete goals]

Ask me anything!
```

**When**: Friday evening

### Example Thread (After First Customer)

```
How I got my first paying customer for Centrid:

A tactical thread 🧵

1/ Two weeks ago: 0 customers, no idea if anyone wanted this.
Today: First paying customer ($19/month).
Here's exactly what I did:

2/ Found 50 people who complained about "Obsidian mobile" on Twitter
in last 30 days.

Tool: Twitter search + "filter:replies"

Why: EXACT pain, RIGHT NOW.

3/ DM template (24% response):
"Hey [Name], saw your tweet about [pain]. Built something for this.
$10 first month, money-back guarantee.
Demo: [link]"

4/ Key: Mentioning "Cursor" got 2x responses.
My audience (indie devs) loves Cursor. Instant reference.

5/ Demo strategy (33% close rate):
- 15 min max
- Start with THEIR pain
- Show THEIR solution
- Let them drive
- Ask for money

6/ What almost made me quit:
First 10 messages → 0 responses
Thought: "Never going to work"
Then 11-20 → 5 responses
Lesson: Keep going.

7/ Next: 5 customers by month end
Changes:
- Better demo (60 sec, one use case)
- Focus Twitter (it works)
- Daily updates

8/ If you're building:
Find 50 people with explicit pain.
Message them.
Show solution.
Ask for money.
It works.
```

### Calendar (Stage 1)

**Week 1**:
- Monday: "Starting - here's the goal"
- Wednesday: "25 messages sent - what's working"
- Friday: "Week 1 recap + learnings"

**Week 2**:
- Monday: "Week 2 goal: Close first customer"
- Wednesday: "First demo - what happened"
- Friday: "Week 2 recap"

**After First Customer**:
- Big thread: "How I got first customer"
- Then weekly updates only

---

## Psychological Survival Guide

### Week 1 Feelings

**You'll feel**:
- "This is awkward" (cold DMing)
- "I'm spamming" (you're not if personalized)
- "No one cares" (most won't, that's okay)
- "This won't work" (it will if you persist)

**Remember**:
- Every founder did this
- You only need ONE yes
- Rejection is data, not personal
- Most won't respond - normal
- Worst case: they ignore you

### After Rejections

**10 messages, 0 responses**:
- Normal
- Keep going
- Refine after 20

**30 messages, 5 responses, 0 conversions**:
- Getting warm
- Something not clicking
- Ask: "What would make this no-brainer?"

**50 messages, 0 customers**:
- Time for honest assessment
- Show to brutally honest friend
- Post in indie hackers: "Help me understand why"
- Consider pivot, but don't give up yet

### Founder Mantra (Repeat Daily)

1. "Someone has this pain"
2. "My product solves it"
3. "I just need to find that someone"
4. "Every 'no' gets me closer"
5. "I only need ONE to validate"

### Celebrate These

- ✅ First response
- ✅ First person watches full demo
- ✅ First "this is interesting"
- ✅ First demo scheduled
- ✅ First payment link clicked
- ✅ First dollar received
- ✅ Customer uses second time
- ✅ "This is great"

Screenshot and save every tiny win.

---

## The Ultimate Truth

**You don't have a distribution problem.**
**You don't have a pricing problem.**
**You don't have a product problem.**

**You have an ACTION problem.**

Everything you need is in this document.

Will you:
- Send 50 personalized messages?
- Follow up?
- Demo to strangers?
- Ask for money?
- Iterate when it doesn't work?
- Keep going when uncomfortable?

If yes: **You WILL get your first customer.**

Not if. When.

Now go do it.

---

## Daily Checklist

Print this, check it off every day:

### Week 1

**Day 1**:
- [ ] Set up tracking spreadsheet
- [ ] Recorded Loom demo
- [ ] Tested product on mobile
- [ ] Created Stripe links
- [ ] Found 10 Twitter prospects

**Day 2**:
- [ ] Found 15 more Twitter (25 total)
- [ ] Found 20 Reddit (45 total)
- [ ] Found 5 LinkedIn/IH (50 total)
- [ ] Organized by A/B/C tier
- [ ] Reviewed demo video

**Day 3**:
- [ ] Sent 10 Twitter DMs
- [ ] Sent 5 Reddit DMs
- [ ] Responded to all replies within 1hr
- [ ] Updated spreadsheet
- [ ] Noted objections

**Day 4**:
- [ ] Sent 5 LinkedIn messages
- [ ] Followed up Day 3 non-responders
- [ ] Responded within 1hr
- [ ] Scheduled demos
- [ ] Sent payment links

**Day 5**:
- [ ] Followed up all pending
- [ ] Completed demos
- [ ] Sent payment links after demos
- [ ] Reviewed Week 1
- [ ] Planned Week 2 refinements

### Week 2

**Day 6-7**:
- [ ] Analyzed Wave 1 (response, objections)
- [ ] Refined messaging
- [ ] Prepared Wave 2
- [ ] Followed up interested from Wave 1

**Day 8-10**:
- [ ] Sent 30 Wave 2 messages (refined)
- [ ] Completed more demos
- [ ] Closed first customer OR identified block
- [ ] If closed: Onboarded successfully
- [ ] If not: Deep analysis

**Day 11-14**:
- [ ] Continue outreach and demos
- [ ] Focus on closing if haven't
- [ ] Daily check-ins with first customer
- [ ] Document what's working
- [ ] Made Stage 1→2 decision

---

*See `02-GO-TO-MARKET.md` for Stage 2 & 3 strategy after you close your first customer.*
