// Research Articles Data
// Last Updated: June 23, 2026
// Structure: 4 grouped subsections + Archive
// Sources: PubMed, NBIA Disorders Association, GOSH, CHOP, OHSU, Stanford,
//          eLife, Nature Communications, Human Gene Therapy, Frontiers, ClinicalTrials.gov

export type ResearchGroup =
  | 'breakthroughs'     // Latest peer-reviewed or institutional findings (last ~12 months)
  | 'programs-trials'   // Active research programs, clinics, registries, trials
  | 'family-platform'   // Adjacent NBIA disorders + platform reads informing BPAN
  | 'community'         // Foundations, coordination, Centers of Excellence
  | 'archive';          // Older items retained for completeness, collapsed by default

export interface ResearchArticle {
  id: string;
  title: string;
  date: string;
  description: string;
  sourceText: string;
  sourceUrl: string;
  group: ResearchGroup;
  badge?: string;       // Small label like "Peer-reviewed" | "Program" | "Registry"
}

export const researchArticles: ResearchArticle[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // LATEST BREAKTHROUGHS (last 12 months — BPAN-direct, peer-reviewed or
  // major institutional milestone)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'aav-wdr45-human-gene-therapy-2025',
    title: 'AAV-WDR45 Gene Therapy Corrects BPAN in Mice — Peer-Reviewed',
    date: 'March 2025',
    description:
      'The Harvard / Mass General mouse study previously circulated as a preprint is now formally published in Human Gene Therapy. Neonatal intracerebroventricular scAAV9-WDR45 fully prevented hyperactivity in BPAN mice — the strongest gene-replacement efficacy signal reported in the field to date and the foundation for future IND-enabling work.',
    sourceText: 'Human Gene Therapy (PubMed 39978419)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39978419/',
    group: 'breakthroughs',
    badge: 'Peer-reviewed',
  },
  {
    id: 'gosh-bpan-family-day-2026',
    title: 'UCL & GOSH Advance BPAN Gene Therapy — Family Day Recap',
    date: 'April 2026',
    description:
      'At the first-ever BPAN Family Day at Great Ormond Street Hospital, Prof. Manju Kurian and colleagues at UCL presented early-stage AAV gene therapy and cardiac glycoside drug-repurposing results in BPAN models. GOSH Charity has awarded £248,559 toward this program; additional private funding is being raised to advance a clinical-grade AAV9 vector.',
    sourceText: 'Great Ormond Street Hospital',
    sourceUrl: 'https://www.gosh.nhs.uk/news/families-and-researchers-come-together-for-bpan-family-day/',
    group: 'breakthroughs',
    badge: 'Program milestone',
  },
  {
    id: 'biotin-x-reactivation-2025',
    title: 'Biotin May Reactivate the Silent WDR45 Gene in Female Patients',
    date: 'February 2025',
    description:
      'Researchers at the Andalusian Center for Developmental Biology (Pablo de Olavide University) report that biotin at 10 µM reactivates the inactive X chromosome and restores WDR45 protein, autophagy, iron homeostasis, and mitochondrial function in female BPAN fibroblasts. The most clinically accessible candidate currently in the BPAN literature; in-vivo validation is next.',
    sourceText: 'International Journal of Molecular Sciences',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11818482/',
    group: 'breakthroughs',
    badge: 'Peer-reviewed',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RESEARCH PROGRAMS & TRIALS (active, participate-or-follow)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'stanford-bpan-program-2025',
    title: 'Stanford Launches $6.7M BPAN Drug-Screening Program',
    date: 'December 2025',
    description:
      'Dr. Juliet Knowles (Stanford Pediatric Neurology), anchored by a $500K Isa Elaine Foundation gift, is running the first systematic FDA-approved compound screen in BPAN patient-derived neurons and developing severity-of-decline biomarkers. A realistic 1–2 year path to a repurposable drug candidate.',
    sourceText: 'Lucile Packard Foundation',
    sourceUrl: 'https://lpfch.org/impact-stories/isa-elaine-foundation/',
    group: 'programs-trials',
    badge: 'Program',
  },
  {
    id: 'chop-bpan-clinic-2025',
    title: 'CHOP BPAN Clinic Builds Trial Readiness Across 20 Centers',
    date: 'Designated April 2025',
    description:
      'The Children\u2019s Hospital of Philadelphia Clinic for BPAN and WDR45-Related Disorders, led by Dr. Laura Adang, anchors a 20-center US consortium working on clinical trial protocol design, biomarker validation, gene therapy approach development, and microglia characterization. Funded by NIH and the Don\u2019t Forget Morgan Foundation.',
    sourceText: 'Children\u2019s Hospital of Philadelphia',
    sourceUrl: 'https://www.chop.edu/centers-programs/clinic-bpan-and-wdr45-related-disorders',
    group: 'programs-trials',
    badge: 'Clinical program',
  },
  {
    id: 'ohsu-bpanready-2026',
    title: 'OHSU BPANready Natural History Study Continues Recruiting',
    date: 'Active (NCT02587858)',
    description:
      'The Hayflick / Hogarth team at Oregon Health & Science University runs BPANready, the online natural history study identifying the MRI findings and blood protein biomarkers the FDA requires before approving gene therapy trials in humans. The same OHSU team is now also co-leading the PKAN gene therapy Pre-IND with UMass Chan.',
    sourceText: 'ClinicalTrials.gov (NCT02587858)',
    sourceUrl: 'https://clinicaltrials.gov/study/NCT02587858',
    group: 'programs-trials',
    badge: 'Registry',
  },
  {
    id: 'cardiac-glycosides-elife-2024',
    title: 'Cardiac Glycosides Restore Autophagy in BPAN Neurons',
    date: 'September 2024 (eLife reviewed)',
    description:
      'A UCL-led iPSC drug screen against the 1,280-compound Prestwick FDA-approved library identified five cardiac glycosides — including digoxin — as top hits for restoring autophagy in BPAN dopaminergic neurons. The cardiac glycoside arm is now part of the UCL/GOSH program presented at the 2026 BPAN Family Day.',
    sourceText: 'eLife (reviewed preprint)',
    sourceUrl: 'https://elifesciences.org/reviewed-preprints/91725v2',
    group: 'programs-trials',
    badge: 'Drug repurposing',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NBIA FAMILY & PLATFORM READS (correlative — informs BPAN)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'pkan-gene-therapy-pre-ind-2025',
    title: 'PKAN Gene Therapy Pre-IND Filed — NHP Study Spring 2026',
    date: 'September 2025',
    description:
      'The OHSU and UMass Chan PKAN gene therapy program (Hayflick, Hogarth, Sena-Esteves) submitted a Pre-IND to the FDA, with a non-human primate study on track for Spring 2026. Same investigators and same UMass Horae Gene Therapy Center platform that would underwrite a future BPAN IND.',
    sourceText: 'Loving Loic Foundation',
    sourceUrl: 'https://www.lovingloic.org/gene-therapy-project',
    group: 'family-platform',
    badge: 'NBIA family',
  },
  {
    id: 'inad-bloomsbury-bgt-2025',
    title: 'INAD (PLAN) Gene Therapy BGT-INAD Nears Clinical Stage',
    date: 'IND target late 2025',
    description:
      'Bloomsbury Genetic Therapies (UCL spin-out) is advancing BGT-INAD, an AAV gene therapy for infantile neuroaxonal dystrophy (PLA2G6), which shares NBIA features with BPAN. Holds FDA Rare Pediatric Disease Designation; first-in-human trial anticipated 2026. Will generate the first NBIA-family clinical safety data directly relevant to BPAN trial design.',
    sourceText: 'NBIA Disorders Association',
    sourceUrl: 'https://nbiadisorders.org/news-events/newsroom/499-inad-gene-therapy',
    group: 'family-platform',
    badge: 'NBIA family',
  },
  {
    id: 'bbp-671-discontinued-2025',
    title: 'PKAN Drug BBP-671 Discontinued — Field Pivots to Gene Therapy',
    date: 'March 2025 (FDA orphan withdrawn)',
    description:
      'CoA Therapeutics (BridgeBio) ended clinical development of BBP-671 for PKAN due to an unworkable safety/efficacy dosing window; the FDA and EMA both withdrew its orphan designation. The NBIA field is now coalescing around gene therapy and autophagy-restoring strategies — the same modalities being pursued for BPAN.',
    sourceText: 'NBIA Disorders Association',
    sourceUrl: 'https://nbiadisorders.org/news-events/newsroom/509-coa-therapeutics-discontinues-bbp-671-clinical-trial-for-pkan',
    group: 'family-platform',
    badge: 'Field signal',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMUNITY & FOUNDATIONS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'bpan-research-roundtable-2025',
    title: '13 Global BPAN Foundations Unite at First Research Roundtable',
    date: 'October 2025',
    description:
      'The NBIA Disorders Association convened 13 BPAN nonprofits from the US, UK, France, Spain, Germany, Italy, Poland, the Netherlands, and Switzerland to align on gene therapy, small molecules, biomarkers, registries, and Centers of Excellence. The roundtable now meets every six months — unprecedented global coordination behind a shared clinical pathway.',
    sourceText: 'NBIA Disorders Association Newsroom',
    sourceUrl: 'https://www.nbiadisorders.org/news-events/newsroom',
    group: 'community',
    badge: 'Coordination',
  },
  {
    id: 'centers-of-excellence-2025',
    title: 'CHOP & UC Davis Designated NBIA Centers of Excellence (2025)',
    date: 'April / May 2025',
    description:
      'The Children\u2019s Hospital of Philadelphia (April 2025) and UC Davis Health MIND Institute (May 2025) were designated NBIA Centers of Excellence by the NBIA Disorders Association, expanding expert multidisciplinary care for BPAN families on both coasts.',
    sourceText: 'NBIA Disorders Association',
    sourceUrl: 'https://nbiadisorders.org/component/content/category/19-medical-information',
    group: 'community',
    badge: 'Centers of Excellence',
  },
  {
    id: 'nord-bpan-database',
    title: 'NORD BPAN Disease Database — Patient & Family Overview',
    date: 'Essential Reference',
    description:
      'The National Organization for Rare Disorders maintains a comprehensive BPAN disease summary covering diagnosis, symptoms, causes, affected populations, and current treatment approaches — a useful entry point for newly diagnosed families and clinicians unfamiliar with the disorder.',
    sourceText: 'NORD (National Organization for Rare Disorders)',
    sourceUrl: 'https://rarediseases.org/mondo-disease/neurodegeneration-with-brain-iron-accumulation-5/',
    group: 'community',
    badge: 'Reference',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ARCHIVE (older items retained for completeness, displayed collapsed)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'harvard-umass-aav-bioRxiv-2024',
    title: 'Harvard / MGH AAV-WDR45 Mouse Study (June 2024 Preprint)',
    date: 'June 2024',
    description:
      'The original bioRxiv preprint demonstrating AAV-mediated WDR45 supplementation in the BPAN mouse model. Superseded in 2025 by the peer-reviewed Human Gene Therapy publication (see Latest Breakthroughs); retained here for historical reference.',
    sourceText: 'bioRxiv preprint (superseded)',
    sourceUrl: 'https://doi.org/10.1101/2024.06.18.599588',
    group: 'archive',
    badge: 'Superseded',
  },
  {
    id: 'umich-chua-metallotoxicity-2024',
    title: 'University of Michigan BPAN Metallotoxicity Research Grant',
    date: '2024',
    description:
      'A two-year grant to Drs. Sami Bhuta and Jason Chua at the University of Michigan to define and target the neuronal determinants of metallotoxicity in BPAN. Grant period has concluded; newer Michigan work (Seo lab single-cell RNA-seq, 2025–2026) now extends this line of research.',
    sourceText: 'Don\u2019t Forget Morgan Research Updates',
    sourceUrl: 'https://www.dontforgetmorgan.org/research',
    group: 'archive',
    badge: 'Completed',
  },
  {
    id: 'tircon-international-registry',
    title: 'TIRCON International NBIA Registry & Natural History Study',
    date: 'NCT05522374',
    description:
      'TIRCON (Treat Iron-Related Childhood-Onset Neurodegeneration) is the European-led consortium managing the global NBIA patient registry. The registry remains the canonical international natural history dataset informing trial design worldwide.',
    sourceText: 'ClinicalTrials.gov (NCT05522374)',
    sourceUrl: 'https://clinicaltrials.gov/study/NCT05522374',
    group: 'archive',
    badge: 'Registry',
  },
];

// Last updated timestamp
export const lastUpdated = 'June 24, 2026';

// Update notes for content managers
export const updateInstructions = `
RESEARCH SECTION UPDATE GUIDE
Last refresh: June 23, 2026 (PR #24 — full content restructure)

STRUCTURE:
- breakthroughs   \u2192 Latest peer-reviewed / institutional milestones (~3 items, <12 months old)
- programs-trials \u2192 Active programs, clinics, registries (~3-4 items)
- family-platform \u2192 NBIA-family & platform reads informing BPAN (~3 items)
- community       \u2192 Foundations, coordination, Centers of Excellence (~3 items)
- archive         \u2192 Older items retained for completeness (collapsed by default)

AUTHORITATIVE SOURCES TO CHECK QUARTERLY:

1. PubMed
   Search: (WDR45[All] OR BPAN[All] OR "beta-propeller protein-associated neurodegeneration"[All])
   Filter by date posted in last 90 days.

2. ClinicalTrials.gov
   Search: WDR45 OR BPAN. Note new trials or status changes (recruiting/completed/results).

3. bioRxiv / medRxiv
   Same query as PubMed. Flag any preprint as Superseded once peer-reviewed.

4. NBIA Disorders Association Newsroom
   https://nbiadisorders.org/news-events/newsroom

5. GOSH BPAN program updates
   https://www.gosh.nhs.uk/our-research/ \u2014 search "BPAN" in news.

6. CHOP BPAN Clinic
   https://www.chop.edu/centers-programs/clinic-bpan-and-wdr45-related-disorders

7. Stanford / Isa Elaine Foundation
   https://lpfch.org \u2014 search "BPAN" or "Knowles"

8. OHSU NBIAcure / Hayflick lab
   Track via PubMed for the OHSU team; nbiacure.org rarely updates.

WHEN TO MOVE AN ARTICLE TO ARCHIVE:
- A preprint has been superseded by a peer-reviewed publication \u2192 archive preprint, add new
- The grant period has ended and no renewal / follow-up publication has appeared
- An event has passed AND the recap is now older than 12 months
- A program has been formally discontinued
Always retain the archived item rather than deleting \u2014 it preserves historical context.

EDITORIAL RULES:

\u2705 Include:
- Peer-reviewed publications (PubMed-indexed)
- Clinical trial milestones (registration, IND, status changes)
- Institutional press releases from credible labs/foundations
- FDA / EMA designations and decisions
- Research grant awards \u2265 $100K
- Centers of Excellence designations

\u274c Avoid:
- Speculative timelines for cures
- Non-peer-reviewed claims of efficacy
- Press releases without methodology
- Sources that don't resolve or aren't BPAN-related
`;
