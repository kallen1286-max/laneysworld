// Research Articles Data
// Last Updated: March 13, 2026
// Update Schedule: Monthly (1st of each month)
// Sources: NBIA Disorders Association, NBIAcure, TIRCON, BPAN Warriors, Don't Forget Morgan

export interface ResearchArticle {
  id: string;
  title: string;
  date: string;
  description: string;
  sourceText: string;
  sourceUrl: string;
  borderColor: string;
  category: 'clinical' | 'public';
  featured?: boolean;
  spotlight?: boolean;
}

export const researchArticles: ResearchArticle[] = [
  // Essential Medical Resources (SPOTLIGHT - Always First)
  {
    id: "nbia-medical-information-resource",
    title: "NBIA Disorders Association Medical Information Hub",
    date: "Essential Resource",
    description: "Comprehensive medical information about BPAN and related NBIA disorders, including symptom management, clinical care guidelines, and treatment options. This trusted resource is maintained by the NBIA Disorders Association and regularly updated with the latest clinical evidence.",
    sourceText: "NBIA Disorders Association",
    sourceUrl: "https://nbiadisorders.org/19-medical-information",
    borderColor: "border-blue-500",
    category: "public",
    spotlight: true
  },
  
  // 2024 Research Updates from Don't Forget Morgan
  {
    id: "johns-hopkins-chua-2024",
    title: "Johns Hopkins Launches Two-Year BPAN Metallotoxicity Research Grant",
    date: "2024",
    description: "Dr. Jason Chua, MD, PhD at Johns Hopkins has received a new two-year grant to define and target the neuronal determinants of metallotoxicity in beta-propeller protein-associated neurodegeneration. This research aims to understand how iron toxicity specifically affects neurons in BPAN.",
    sourceText: "Don't Forget Morgan Research Updates",
    sourceUrl: "https://www.dontforgetmorgan.org/research",
    borderColor: "border-green-500",
    category: "clinical",
    featured: true
  },
  {
    id: "harvard-umass-aav-gene-therapy-2024",
    title: "Harvard/UMass Gene Therapy Study Shows Efficacy in BPAN Mouse Model",
    date: "June 2024",
    description: "Co-funded by Harper's Hope, researchers at Massachusetts General Hospital and Harvard Medical School demonstrated that AAV-mediated WDR45 gene supplementation successfully improves neurologic function in the BPAN mouse model. The study showed rescue of hyperactive behavior, correction of autophagy markers, and efficacy even when administered after symptom onset—critical for real-world clinical application. Read the full preprint on bioRxiv.",
    sourceText: "bioRxiv Preprint - MGH/Harvard",
    sourceUrl: "https://doi.org/10.1101/2024.06.18.599588",
    borderColor: "border-teal-500",
    category: "clinical",
    featured: true
  },
  
  // Real Research & Clinical News Sources (Updated Monthly)
  {
    id: "nbia-newsroom-2026",
    title: "NBIA Disorders Association Research News & Centers of Excellence",
    date: "Updated Regularly",
    description: "The NBIA Disorders Association is the primary bridge between families and the scientific community, funding breakthrough grants and hosting biennial conferences. Their newsroom features updates on the expanded Centers of Excellence program (now at five U.S. locations) and the 2026 Collaborative Grant Call for translational PKAN research.",
    sourceText: "NBIA Disorders Association Newsroom",
    sourceUrl: "https://nbiadisorders.org/news-events/newsroom",
    borderColor: "border-green-500",
    category: "public",
    featured: true
  },
  {
    id: "nbiacure-ohsu-research-2026",
    title: "NBIAcure - OHSU Clinical Progress & BPANready Study",
    date: "Active Clinical Program",
    description: "Managed by the Hayflick/Hogarth team at Oregon Health & Science University, NBIAcure tracks active trials including BPANready, which identifies disease markers (MRI findings and blood proteins) required by the FDA before gene therapy can be approved for human trials. The most scientifically detailed site for BPAN/NBIA clinical progress.",
    sourceText: "NBIAcure.org (OHSU)",
    sourceUrl: "https://nbiacure.org/our-research/",
    borderColor: "border-blue-500",
    category: "clinical",
    featured: true
  },
  {
    id: "tircon-international-registry-2026",
    title: "TIRCON International NBIA Registry & Natural History Study",
    date: "Ongoing Global Study",
    description: "TIRCON (Treat Iron-Related Childhood-Onset Neurodegeneration) is the European-led consortium managing the global patient registry. Most 2026 breakthroughs come from Natural History data collected here (NCT05522374), which defines disease progression patterns and informs clinical trial design worldwide.",
    sourceText: "TIRCON / ClinicalTrials.gov",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05522374",
    borderColor: "border-purple-500",
    category: "clinical"
  },
  {
    id: "bpan-warriors-2026",
    title: "BPAN Warriors Research Roadmap & Gene Therapy Updates",
    date: "BPAN-Specific Focus",
    description: "The only U.S. nonprofit dedicated exclusively to BPAN, BPAN Warriors shares pre-publication news about gene therapy progress and small-molecule research faster than larger organizations. Follow their Research Roadmap and announcements for the April 18, 2026 BPAN Family Day at Great Ormond Street Hospital in London.",
    sourceText: "BPAN Warriors",
    sourceUrl: "https://www.bpanwarriors.org/",
    borderColor: "border-pink-500",
    category: "public"
  },
  {
    id: "nord-bpan-2026",
    title: "NORD BPAN Disease Database - Comprehensive Overview",
    date: "Essential Reference",
    description: "The National Organization for Rare Disorders (NORD) maintains a detailed BPAN disease database covering diagnosis, symptoms, causes, affected populations, and current treatment approaches. NORD is a leading voice in rare disease advocacy with 40+ years of experience supporting patients and families.",
    sourceText: "NORD (National Organization for Rare Disorders)",
    sourceUrl: "https://rarediseases.org/mondo-disease/neurodegeneration-with-brain-iron-accumulation-5/",
    borderColor: "border-indigo-500",
    category: "public"
  }
];

// Last updated timestamp
export const lastUpdated = "March 13, 2026";

// Update notes for content managers
export const updateInstructions = `
MONTHLY UPDATE INSTRUCTIONS (1st of each month):

AUTHORITATIVE SOURCES TO CHECK:

1. **Don't Forget Morgan Research Updates**
   - URL: https://www.dontforgetmorgan.org/research
   - Check: Latest research grants, gene therapy progress, lab partnerships
   - Update: New research announcements, clinical trial updates, breakthrough findings

2. **NBIA Disorders Association Newsroom**
   - URL: https://nbiadisorders.org/news-events/newsroom
   - Check: Research news, Message from the President, Centers of Excellence updates
   - Update: Grant announcements, conference highlights, new collaborations

3. **NBIAcure (OHSU Research Portal)**
   - URL: https://nbiacure.org/our-research/
   - Check: "In the Clinic" tab, BPANready study updates, active trials
   - Update: Clinical trial milestones, FDA submission progress, biomarker discoveries

4. **TIRCON International Registry**
   - URL: https://clinicaltrials.gov/study/NCT05522374
   - Check: Study status updates, results posted, natural history data
   - Update: Enrollment numbers, data analysis publications, registry expansions

5. **BPAN Warriors**
   - URL: https://www.bpanwarriors.org/
   - Check: Research Roadmap, News section, Family Day announcements
   - Update: Gene therapy progress, small-molecule research, community events

6. **Key Research Labs** (Check for publications/announcements):
   - UPenn Orphan Disease Center: https://www.med.upenn.edu/orphan/
   - Prokisch Lab (Helmholtz Munich): https://www.helmholtz-munich.de/en/research-groups/prokisch-lab
   - UCL/Great Ormond Street: https://www.gosh.nhs.uk/our-research/
   - PubMed search: "BPAN" OR "WDR45" OR "beta-propeller protein-associated neurodegeneration"

UPDATING PROCEDURE:

1. Visit each source and check for news dated within the last 30-60 days
2. Update article titles, dates, and descriptions with latest information
3. Keep the NBIA Medical Information Hub as spotlight (first card)
4. Prioritize updates in this order:
   a. NBIA Newsroom (primary news source)
   b. NBIAcure clinical updates (trial progress)
   c. BPAN Warriors (BPAN-specific news)
   d. TIRCON registry milestones
   e. Research lab breakthroughs
5. Update lastUpdated timestamp to current date
6. Verify all URLs are working
7. Keep 7-8 total articles (1 spotlight + 6-7 current items)

CONTENT PRIORITIES:

✅ **Include:**
- Clinical trial announcements and progress
- FDA regulatory milestones
- Natural history study findings
- Gene therapy vector development
- Small molecule research breakthroughs
- Patient registry expansions
- Community events (Family Days, conferences)
- Research grant awards

❌ **Avoid:**
- Speculative timelines
- Overpromising cure dates
- Non-peer-reviewed claims
- Unverified treatments

SPOTLIGHT RESOURCE RULES:
- NBIA Disorders Association Medical Information Hub should always be spotlight: true
- This card always appears first with blue gradient background
- Update its description if NBIA updates their medical information content
- Keep it as "Essential Resource" (no date needed)

BORDER COLOR ROTATION:
Use varied colors to make cards visually distinct:
- border-blue-500, border-green-500, border-purple-500, border-pink-500
- border-red-500, border-yellow-500, border-indigo-500, border-teal-500

CATEGORY CLASSIFICATION:
- "clinical" = Research institutions, clinical trials, academic labs
- "public" = Patient advocacy groups, community news, FDA public announcements
`;