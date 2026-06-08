# 🚀 Research Articles - Quick Start Guide

**Last Updated:** March 10, 2026  
**Next Update:** April 1, 2026

---

## ✅ What Just Changed?

Your "Recent Breakthroughs" section now features **real, authoritative BPAN/NBIA research sources**:

### ✨ Current Articles (5 Total - All Links Verified)

1. **NBIA Disorders Association Medical Hub** ⭐ (Spotlight - Always First)
2. **NBIA Newsroom** - Research news & Centers of Excellence
3. **NBIAcure (OHSU)** - BPANready study & clinical trials
4. **TIRCON Registry** - International natural history study
5. **BPAN Warriors** - BPAN-specific news & Family Day

### 🎯 What's New?

- ✅ All sources are **real** BPAN/NBIA research hubs
- ✅ All links **verified working** (broken links removed)
- ✅ Content reflects **current research focus areas** (March 2026)
- ✅ **"Last updated" date** displays on site (March 10, 2026)
- ✅ Clear **monthly update instructions** in data file
- ✅ **Update schedule documentation** created

---

## 📅 Monthly Update (5 Easy Steps)

### 1️⃣ Visit Sources (10 min)

Open these 4 main sources:

- **NBIA Newsroom:** https://nbiadisorders.org/news-events/newsroom
- **NBIAcure Research:** https://nbiacure.org/our-research/
- **BPAN Warriors:** https://www.bpanwarriors.org/
- **TIRCON Registry:** https://clinicaltrials.gov/study/NCT05522374

Look for news dated within last 30-60 days.

---

### 2️⃣ Open Data File (1 min)

File location: `/data/research-articles.ts`

This is where all research cards are stored.

---

### 3️⃣ Update Content (15 min)

For each new piece of news:

**Update existing card:**
```typescript
{
  id: "nbia-newsroom-2026",
  title: "NEW TITLE HERE",  // ← Update with latest news
  date: "Apr 2026",          // ← Update date
  description: "NEW DESCRIPTION...",  // ← Update details
  sourceText: "NBIA Disorders Association Newsroom",
  sourceUrl: "https://nbiadisorders.org/news-events/newsroom",
  borderColor: "border-green-500",
  category: "public",
  featured: true
}
```

**Keep spotlight card unchanged:**
```typescript
{
  id: "nbia-medical-information-resource",
  title: "NBIA Disorders Association Medical Information Hub",
  // ... keep as-is (this is evergreen content)
  spotlight: true  // ← Always keep this
}
```

---

### 4️⃣ Update Timestamp (1 min)

At bottom of file:

```typescript
export const lastUpdated = "April 1, 2026";  // ← Change to current date
```

---

### 5️⃣ Deploy (3 min)

- Save file
- Preview site locally
- Check that "Last updated: April 1, 2026" appears
- Deploy to laneysworld.com

---

## 🔔 Set Up Monthly Reminder

### Google Calendar

1. Create event: **"Update BPAN Research Articles"**
2. Set to: **1st of every month, 9:00 AM**
3. Add note: "Update /data/research-articles.ts"
4. Add links:
   - https://nbiadisorders.org/news-events/newsroom
   - https://nbiacure.org/our-research/
   - https://www.bpanwarriors.org/
   - https://clinicaltrials.gov/study/NCT05522374

### Email Subscriptions (Automatic Alerts)

Sign up for newsletters to get news automatically:

- NBIA Disorders Association newsletter
- BPAN Warriors email updates
- PubMed alerts for "BPAN" or "WDR45"

---

## 📊 Track What's Working

After each update, check Google Analytics:

1. Go to: https://analytics.google.com
2. Events → `research_article_click`
3. See which sources get most clicks
4. Focus future updates on popular topics

---

## ❓ FAQ

### Q: What if there's no new news this month?

**A:** That's okay! Just update the `lastUpdated` date to show you checked. You can keep the same articles.

### Q: What if there's MAJOR news (FDA approval, trial results)?

**A:** Update immediately! Don't wait for the monthly schedule. Add a new card or update an existing one.

### Q: How many articles should I have?

**A:** Keep 7-8 total (1 spotlight + 6-7 current). Remove oldest if adding new ones.

### Q: Can I change the spotlight card?

**A:** You can update its description, but keep it as the NBIA Medical Hub. It's an evergreen resource families rely on.

### Q: What if a link breaks?

**A:** Update the `sourceUrl` to the new correct link, or remove that card and add different news.

---

## 🎯 Content Quality Checklist

Before publishing updates:

- [ ] All titles are clear and descriptive
- [ ] Dates are accurate (or say "Updated Regularly")
- [ ] Descriptions are 2-3 sentences
- [ ] All links work (click to test)
- [ ] No overpromising cure timelines
- [ ] Language is hopeful but honest
- [ ] `lastUpdated` timestamp is current
- [ ] Preview looks good on mobile

---

## 📝 Full Documentation

For detailed instructions, see:

- **`/RESEARCH-UPDATE-SCHEDULE.md`** - Complete update guide
- **`/data/research-articles.ts`** - Data file with full instructions
- **`/LAUNCH-READY.md`** - Overall site documentation

---

## 💜 You're All Set!

Your research section is now powered by **real, authoritative sources** and has a clear monthly update schedule.

**Next action:** Set calendar reminder for April 1, 2026 🗓️

Questions? Just ask! 

---

**Quick Links:**
- Data file: `/data/research-articles.ts`
- NBIA Newsroom: https://nbiadisorders.org/news-events/newsroom
- NBIAcure: https://nbiacure.org/our-research/
- BPAN Warriors: https://www.bpanwarriors.org/