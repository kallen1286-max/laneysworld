import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { ScienceFlowchart } from './components/science-flowchart';
import { AnimatedPoem } from './components/animated-poem';
import { Heart, Brain, Star, Instagram, X, Facebook, BookOpen, Dna, Microscope, Hospital, MapPin, Phone, Mail, ExternalLink, AlertTriangle, XCircle, ArrowRight, Stethoscope, BookMarked, MessageSquare, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
// Original Figma export referenced baca29e45...png, which was not included in the asset bundle.
// Reusing the existing "Delaney with dad" hero image for the JSON-LD schema metadata below.
import delaneyImage from 'figma:asset/b2d2fff468f3870a27738c2bbc25204d46bf33c0.png';
import delaneyKitchenImage from 'figma:asset/7cf5676660f7d2bb8e0409466faeb6216b7fdfa0.png';
import delaneyFamBeachImage from 'figma:asset/a0137830d447550abbced25778ec2fd623466fa1.png';
import delaneyFacePaintImage from 'figma:asset/73bf55c703ceaf90081eabc8dff6b452e231341c.png';
import delaneySwingImage from 'figma:asset/3c19ab96950b4b4668e5ce73ec0992d7308efaa5.png';
import delaneyGuitarNewImage from 'figma:asset/3f5d96b8a788967eb9bfeb3b92187def162bc352.png';
import delaneyMeatballsNewImage from 'figma:asset/a20afdf46717d2843eb0c4e659ab0d5ce2a3c2eb.png';
import delaneyDadSunsetHeroImage from 'figma:asset/b2d2fff468f3870a27738c2bbc25204d46bf33c0.png';
import delaneyFamilyFarmImage from 'figma:asset/2d9cfc58c306febc731ea9f6c6f5ab4ec0f2cff0.png';
import delaneyDadNewImage from 'figma:asset/2e11e1f5c3597beb16397a3aba515293c8ec6cb7.png';
import delaneyIceCreamDadImage from 'figma:asset/843a35f5dd3cd234c6c26e5d455cdf8b8748171d.png';
import laneysWorldLogo from 'figma:asset/098025f9056d201a154be344dcf4936569c25264.png';
import { researchArticles, lastUpdated } from './data/research-articles';
import { Link } from './components/ui/link';
import { Toaster } from './components/ui/sonner';
import { trackEvent } from './utils/analytics';
import { LiteYouTube } from './components/LiteYouTube';
// Lazy: only loaded when the user opens the feedback form or navigates to /privacy.
// Trims ~25KB off the initial JS bundle and defers the work for low-bandwidth clients.
const FeedbackModal = lazy(() =>
  import('./components/FeedbackModal').then((m) => ({ default: m.FeedbackModal })),
);
const PrivacyPolicy = lazy(() =>
  import('./components/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })),
);
import { toast } from 'sonner@2.0.3';

// Donation URL
const DONATION_URL = 'https://www.gofundme.com/f/morgans-fight-to-find-a-cure-for-bpan';

// Google Analytics 4 Configuration
const GA4_ID = 'G-ZS831G1M89';

// Scroll thresholds and timing constants
const STICKY_HEADER_THRESHOLD = 100;
const LOADING_SCREEN_DURATION = 800;

// Calculate Delaney's current age
const calculateDelaneyAge = () => {
  const birthday = new Date('2023-05-17');
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
};

export default function App() {
  // Calculate Delaney's age once
  const delaneyAge = calculateDelaneyAge();
  
  // State for sticky header visibility
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  // State for loading screen
  const [isLoading, setIsLoading] = useState(true);
  // State for feedback modal
  const [showFeedback, setShowFeedback] = useState(false);
  // State for where the feedback modal was opened from (for GA4)
  const [feedbackOpenedFrom, setFeedbackOpenedFrom] = useState<string>('unknown');
  // State for video transcript modal
  const [showTranscript, setShowTranscript] = useState(false);
  // Track which scroll-depth milestones have already fired (avoids duplicates)
  const scrollDepthFiredRef = useRef(new Set<number>());
  // Ref for sticky header — used to apply/remove `inert` when off-screen (SC 2.1.1 fix)
  const stickyHeaderRef = useRef<HTMLElement>(null);
  // Ref for transcript modal inner container — used for focus trap (SC 2.1.2 fix)
  const transcriptModalRef = useRef<HTMLDivElement>(null);

  // ── Lightweight client-side router ──────────────────────────────────────
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    // Handle scroll: sticky header + scroll depth milestones
    const handleScroll = () => {
      setShowStickyHeader(window.scrollY > STICKY_HEADER_THRESHOLD);

      // Scroll depth tracking — 25 / 50 / 75 / 90 %
      const docEl = document.documentElement;
      const scrollable = docEl.scrollHeight - docEl.clientHeight;
      if (scrollable > 0) {
        const pct = Math.round((window.scrollY / scrollable) * 100);
        ([25, 50, 75, 90] as const).forEach(threshold => {
          if (pct >= threshold && !scrollDepthFiredRef.current.has(threshold)) {
            scrollDepthFiredRef.current.add(threshold);
            trackEvent('scroll', { percent_scrolled: threshold });
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePop = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // ── Share handler — Web Share API with clipboard fallback ────────────────
  const shareStory = async () => {
    const shareData = {
      title: "Delaney's World – Fight BPAN",
      text: `Meet Delaney — a ${delaneyAge}-year-old fighting BPAN, a rare neurodegenerative disorder affecting ~500 children worldwide. Help fund gene therapy research that could change everything. 💙`,
      url: window.location.origin,
    };
    try {
      if (typeof navigator.share === 'function' && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        trackEvent('share', { method: 'native_share', content_type: 'landing_page', share_location: 'final_cta' });
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Copied to clipboard!', { description: 'Paste and share Delaney\'s story anywhere.' });
        trackEvent('share', { method: 'clipboard_copy', content_type: 'landing_page', share_location: 'final_cta' });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareData.url);
          toast.success('Link copied!', { description: 'Share laneysworld.com with your network.' });
        } catch {
          toast.error('Unable to share', { description: 'Please copy the URL from your browser.' });
        }
      }
    }
  };

  // SC 2.1.1 / 2.4.3: Make sticky header unreachable by keyboard and AT when off-screen
  useEffect(() => {
    const el = stickyHeaderRef.current;
    if (!el) return;
    if (showStickyHeader) {
      el.removeAttribute('inert');
      el.removeAttribute('aria-hidden');
    } else {
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    }
  }, [showStickyHeader]);

  useEffect(() => {
    // Simulate loading state - remove after initial render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_SCREEN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Section visibility tracking — fires once per section when 30% is visible
  useEffect(() => {
    const SECTIONS = [
      { id: 'what-is-bpan',      name: 'bpan_education'       },
      { id: 'science',           name: 'science_flowchart'    },
      { id: 'delaneys-world',    name: 'delaneys_story'       },
      { id: 'moments',           name: 'photo_gallery'        },
      { id: 'research',          name: 'gene_therapy_research'},
      { id: 'centers-of-excellence', name: 'centers_of_excellence' },
      { id: 'final-cta',         name: 'final_cta'            },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionName = entry.target.getAttribute('data-ga-section');
            if (sectionName) {
              trackEvent('section_view', { section_name: sectionName });
              observer.unobserve(entry.target); // fire once per section per session
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    SECTIONS.forEach(({ id, name }) => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute('data-ga-section', name);
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Set document language and title FIRST (before GA4 loads)
    document.documentElement.lang = 'en';
    document.title = "Delaney's World | BPAN Gene Therapy Research & Rare Disease Charity";

    // ========================================
    // PERFORMANCE OPTIMIZATION: Resource Hints
    // ========================================
    
    // dns-prefetch for YouTube thumbnail CDN — low-cost hint since iframe is lazy (LiteYouTube)
    const dnsPrefetchYtImg = document.createElement('link');
    dnsPrefetchYtImg.rel = 'dns-prefetch';
    dnsPrefetchYtImg.href = 'https://i.ytimg.com';
    document.head.appendChild(dnsPrefetchYtImg);

    // Preconnect to Google Analytics
    const preconnectGA = document.createElement('link');
    preconnectGA.rel = 'preconnect';
    preconnectGA.href = 'https://www.googletagmanager.com';
    document.head.appendChild(preconnectGA);

    // dns-prefetch for GoFundMe (primary CTA destination)
    const dnsPrefetchGFM = document.createElement('link');
    dnsPrefetchGFM.rel = 'dns-prefetch';
    dnsPrefetchGFM.href = 'https://www.gofundme.com';
    document.head.appendChild(dnsPrefetchGFM);

    // Load Google Analytics 4
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}

      // IMPORTANT: consent MUST be set before gtag('js', ...) fires any hits
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'granted',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });

      gtag('js', new Date());

      // Configure Google Analytics (anonymize_ip removed — GA4 anonymizes by default)
      gtag('config', '${GA4_ID}', {
        'allow_google_signals': false,
        'allow_ad_personalization_signals': false,
        'send_page_view': true,
        'page_title': document.title,
        'page_location': window.location.href
      });
    `;
    document.head.appendChild(script2);

    // ========================================
    // CRITICAL META TAGS FOR MOBILE & SEO
    // ========================================
    
    // Viewport meta tag - CRITICAL for mobile-first indexing
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.setAttribute('name', 'viewport');
      document.head.appendChild(metaViewport);
    }
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover');
    
    // Charset meta tag
    let metaCharset = document.querySelector('meta[charset]');
    if (!metaCharset) {
      metaCharset = document.createElement('meta');
      metaCharset.setAttribute('charset', 'UTF-8');
      document.head.insertBefore(metaCharset, document.head.firstChild);
    }
    
    // ========================================
    // SEO META TAGS
    // ========================================
    
    // Meta description for SEO
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', `Meet Delaney, a brave ${delaneyAge}-year-old with BPAN, a rare neurodegenerative disease. Support gene therapy research & rare disease charity. Donate to give hope.`);
    
    // Keywords meta tag
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'BPAN, Beta-propeller Protein-Associated Neurodegeneration, WDR45, rare disease, rare disease charity, neurodegeneration, gene therapy, gene therapy research, Delaney, children with BPAN, NBIA disorders, rare disease research, charitable donations, pediatric neurodegeneration, Don\'t Forget Morgan, BPAN awareness, BPAN fundraising');
    
    // Author meta tag
    let metaAuthor = document.querySelector('meta[name="author"]');
    if (!metaAuthor) {
      metaAuthor = document.createElement('meta');
      metaAuthor.setAttribute('name', 'author');
      document.head.appendChild(metaAuthor);
    }
    metaAuthor.setAttribute('content', 'Delaney\'s Family');
    
    // Robots meta tag - tells search engines to index and follow links
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // Canonical URL - prevents duplicate content issues
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', window.location.href.split('?')[0].split('#')[0]);
    
    // ========================================
    // OPEN GRAPH TAGS (Facebook, LinkedIn)
    // ========================================
    
    const ogTags = [
      { property: 'og:title', content: "Delaney's World | Fighting BPAN - Rare Disease Charity for Gene Therapy Research" },
      { property: 'og:description', content: `Meet Delaney, a brave ${delaneyAge}-year-old with BPAN. Support gene therapy research for this rare neurodegenerative disease. Donate to give hope.` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: laneysWorldLogo },
      { property: 'og:image:secure_url', content: laneysWorldLogo },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:alt', content: "Delaney's World - Anchored in Love & Joy - BPAN Awareness logo" },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:url', content: window.location.href.split('?')[0].split('#')[0] },
      { property: 'og:site_name', content: "Delaney's World" },
      { property: 'og:locale', content: 'en_US' }
    ];
    
    ogTags.forEach(tag => {
      let ogTag = document.querySelector(`meta[property="${tag.property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', tag.property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', tag.content);
    });
    
    // ========================================
    // TWITTER CARD TAGS
    // ========================================
    
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: "Delaney's World | Fighting BPAN - Rare Disease Charity" },
      { name: 'twitter:description', content: `Meet Delaney, a brave ${delaneyAge}-year-old with BPAN. Support gene therapy research for this rare neurodegenerative disease. Donate to give hope.` },
      { name: 'twitter:image', content: laneysWorldLogo },
      { name: 'twitter:image:alt', content: "Delaney's World - Anchored in Love & Joy - BPAN Awareness logo" }
    ];
    
    twitterTags.forEach(tag => {
      let twitterTag = document.querySelector(`meta[name="${tag.name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', tag.name);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute('content', tag.content);
    });
    
    // ========================================
    // THEME COLOR (for mobile browsers)
    // ========================================
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', '#2563eb'); // Blue-600 to match your brand
    
    // ========================================
    // FAVICON
    // ========================================
    
    // Favicon link
    let linkFavicon = document.querySelector('link[rel="icon"]');
    if (!linkFavicon) {
      linkFavicon = document.createElement('link');
      linkFavicon.setAttribute('rel', 'icon');
      document.head.appendChild(linkFavicon);
    }
    linkFavicon.setAttribute('type', 'image/png');
    linkFavicon.setAttribute('href', laneysWorldLogo);
    
    // Apple Touch Icon (for iOS home screen)
    let linkAppleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!linkAppleTouchIcon) {
      linkAppleTouchIcon = document.createElement('link');
      linkAppleTouchIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(linkAppleTouchIcon);
    }
    linkAppleTouchIcon.setAttribute('href', laneysWorldLogo);
    
    // ========================================
    // SCHEMA.ORG STRUCTURED DATA (JSON-LD)
    // ========================================
    
    // Schema.org structured data helps search engines understand your content
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        // Organization Schema
        {
          "@type": "Organization",
          "@id": `${window.location.origin}/#organization`,
          "name": "Delaney's World",
          "url": window.location.origin,
          "logo": laneysWorldLogo,
          "description": "Supporting BPAN research and raising awareness for Beta-propeller Protein-Associated Neurodegeneration through Delaney's story. A rare disease charity focused on funding gene therapy research for children with BPAN.",
          "foundingDate": "2024",
          "founder": {
            "@type": "Person",
            "name": "Delaney's Family",
            "description": "Parents of Delaney, advocating for BPAN awareness and research funding"
          },
          "sameAs": [
            "https://www.dontforgetmorgan.org/",
            "https://www.instagram.com/eefahmd/",
            "https://www.instagram.com/instajamman12/",
            "https://x.com/theprecipice12"
          ],
          "areaServed": "Worldwide",
          "knowsAbout": [
            "BPAN",
            "Beta-propeller Protein-Associated Neurodegeneration",
            "WDR45 gene mutation",
            "Rare neurodegenerative disorders",
            "Gene therapy research",
            "NBIA disorders",
            "Pediatric neurodegeneration"
          ],
          "location": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Fairfield",
              "addressRegion": "CT",
              "addressCountry": "US"
            }
          },
          "memberOf": {
            "@type": "Organization",
            "name": "Don't Forget Morgan",
            "url": "https://www.dontforgetmorgan.org/"
          }
        },
        // Person Schema - Delaney
        {
          "@type": "Person",
          "@id": `${window.location.origin}/#person-delaney`,
          "name": "Delaney",
          "description": `A brave ${delaneyAge}-year-old girl living with BPAN (Beta-propeller Protein-Associated Neurodegeneration)`,
          "image": delaneyImage,
          "affiliation": {
            "@id": `${window.location.origin}/#organization`
          }
        },
        // Medical Condition Schema - BPAN
        {
          "@type": "MedicalCondition",
          "@id": `${window.location.origin}/#condition-bpan`,
          "name": "BPAN",
          "alternateName": ["Beta-propeller Protein-Associated Neurodegeneration", "WDR45-related NBIA"],
          "description": "A rare neurodegenerative disorder caused by mutations in the WDR45 gene, characterized by iron buildup in the brain, seizures, and developmental delays.",
          "associatedAnatomy": [
            {
              "@type": "AnatomicalStructure",
              "name": "Brain"
            },
            {
              "@type": "AnatomicalStructure",
              "name": "Basal ganglia"
            }
          ],
          "code": {
            "@type": "MedicalCode",
            "code": "WDR45",
            "codingSystem": "Gene"
          },
          "epidemiology": "Approximately 500 children worldwide",
          "relevantSpecialty": {
            "@type": "MedicalSpecialty",
            "name": "Neurology"
          },
          "mainEntityOfPage": window.location.origin,
          "possibleTreatment": {
            "@type": "MedicalTherapy",
            "name": "Gene Therapy"
          }
        },
        // Website Schema
        {
          "@type": "WebSite",
          "@id": `${window.location.origin}/#website`,
          "url": window.location.origin,
          "name": "Delaney's World",
          "description": "Meet Delaney, one of 500 children worldwide fighting BPAN. Your donation supports gene therapy research for rare neurodegeneration.",
          "publisher": {
            "@id": `${window.location.origin}/#organization`
          },
          "inLanguage": "en-US"
        },
        // WebPage Schema
        {
          "@type": "WebPage",
          "@id": window.location.href,
          "url": window.location.href,
          "name": "Delaney's World | BPAN Rare Disease Charity - Support Gene Therapy Research for Children",
          "description": `Meet Delaney, a brave ${delaneyAge}-year-old with BPAN, a rare neurodegenerative disease. Support gene therapy research & rare disease charity. Donate to give hope.`,
          "datePublished": "2024-01-01",
          "dateModified": "2026-03-16",
          "isPartOf": {
            "@id": `${window.location.origin}/#website`
          },
          "about": [
            {
              "@id": `${window.location.origin}/#person-delaney`
            },
            {
              "@id": `${window.location.origin}/#condition-bpan`
            }
          ],
          "primaryImageOfPage": {
            "@type": "ImageObject",
            "url": delaneyImage,
            "description": "Delaney with her father - a joyful moment"
          },
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", "#main-content"]
          }
        },
        // NonprofitOrganization Schema — Don't Forget Me Foundation (501c3)
        {
          "@type": "NGO",
          "@id": `${window.location.origin}/#nonprofit`,
          "name": "Don't Forget Me Foundation",
          "legalName": "Don't Forget Me Foundation",
          "taxID": "84-3358278",
          "nonprofitStatus": "Nonprofit501c3",
          "url": "https://www.dontforgetmorgan.org/",
          "description": "A 501(c)(3) nonprofit organization raising funds for BPAN gene therapy research and rare disease awareness. Donations are tax-deductible as allowed by law.",
          "sameAs": ["https://www.dontforgetmorgan.org/"]
        },
        // Donation Action
        {
          "@type": "DonateAction",
          "@id": `${window.location.origin}/#donate-action`,
          "name": "Support Gene Therapy for Kids Like Delaney",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": DONATION_URL,
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform"
            ]
          },
          "recipient": {
            "@id": `${window.location.origin}/#nonprofit`
          }
        },
        // FAQ Schema for better search visibility
        {
          "@type": "FAQPage",
          "@id": `${window.location.origin}/#faq`,
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is BPAN?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "BPAN (Beta-propeller Protein-Associated Neurodegeneration) is a rare neurodegenerative disorder caused by a spontaneous mutation in the WDR45 gene. It leads to iron buildup in the brain, causing seizures, developmental delays, and progressive neurodegeneration. Only about 500 children worldwide are affected by BPAN."
              }
            },
            {
              "@type": "Question",
              "name": "How can I help children with BPAN?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can help by making a tax-deductible donation to the Don't Forget Me Foundation to support gene therapy research, sharing awareness about BPAN on social media, and reaching out directly through laneysworld.com to connect with the family and learn about upcoming events and fundraisers."
              }
            },
            {
              "@type": "Question",
              "name": "What are the symptoms of BPAN?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "BPAN symptoms typically include global developmental delay, intellectual disability, limited or absent speech, seizures (often beginning in childhood), sleep disturbances, and autistic features. As the disease progresses into adulthood, patients may develop parkinsonism and dementia due to iron accumulation in the brain's basal ganglia. Early diagnosis through genetic testing for the WDR45 gene mutation is critical."
              }
            },
            {
              "@type": "Question",
              "name": "Is there a cure for BPAN?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "There is currently no approved cure for BPAN, but gene therapy research offers real hope. Scientists at institutions including the NIH, Children's Hospital of Philadelphia, and Stanford University are actively developing gene therapy approaches that aim to correct the underlying WDR45 mutation. Preclinical results have been encouraging. Your donation directly accelerates this research."
              }
            },
            {
              "@type": "Question",
              "name": "What is gene therapy for BPAN?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Gene therapy is a promising treatment approach for BPAN that aims to correct or compensate for the WDR45 gene mutation. Recent breakthroughs from institutions like NIH, Children's Hospital of Philadelphia, and Stanford show significant progress in developing gene therapy treatments for rare neurodegenerative disorders like BPAN."
              }
            },
            {
              "@type": "Question",
              "name": "How rare is BPAN?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "BPAN is extremely rare, affecting an estimated 500 children worldwide. This makes awareness and fundraising critical, as research funding for rare diseases is often limited compared to more common conditions."
              }
            },
            {
              "@type": "Question",
              "name": "Who is Delaney?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `Delaney is a brave ${delaneyAge}-year-old girl living with BPAN. Despite facing enormous challenges from this rare neurodegenerative disorder, she is full of laughter, empathy, and quiet strength. Delaney's World was created to raise awareness and funds for BPAN research through her inspiring story.`
              }
            }
          ]
        }
      ]
    };
    
    // Add structured data to page
    let scriptSchema = document.querySelector('script[type="application/ld+json"]');
    if (!scriptSchema) {
      scriptSchema = document.createElement('script');
      scriptSchema.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptSchema);
    }
    scriptSchema.textContent = JSON.stringify(structuredData);

    // ========================================
    // VIDEO OBJECT STRUCTURED DATA
    // ========================================
    
    // Add VideoObject schema for the YouTube video
    const videoSchema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "Delaney's Joyful Moment - A Glimpse into Her World",
      "description": "A heartwarming video capturing Delaney's spirit and joy. Despite facing enormous challenges from BPAN, her infectious smile and warm personality shine through, reminding us of the beautiful person at the heart of this journey.",
      "thumbnailUrl": "https://i.ytimg.com/vi/xbpCgGgdjWk/maxresdefault.jpg",
      "uploadDate": "2024-12-01T00:00:00Z",
      "duration": "PT1M30S",
      "contentUrl": "https://www.youtube.com/watch?v=xbpCgGgdjWk",
      "embedUrl": "https://www.youtube-nocookie.com/embed/xbpCgGgdjWk",
      "publisher": {
        "@type": "Organization",
        "name": "Delaney's World",
        "logo": {
          "@type": "ImageObject",
          "url": laneysWorldLogo
        }
      }
    };
    
    // Add video schema to page
    let scriptVideoSchema = document.querySelector('script[data-schema=\"video\"]');
    if (!scriptVideoSchema) {
      scriptVideoSchema = document.createElement('script');
      scriptVideoSchema.setAttribute('type', 'application/ld+json');
      scriptVideoSchema.setAttribute('data-schema', 'video');
      document.head.appendChild(scriptVideoSchema);
    }
    scriptVideoSchema.textContent = JSON.stringify(videoSchema);

  }, []);



  // Handle ESC key to close transcript modal + focus management
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTranscript) {
        setShowTranscript(false);
      }
    };
    
    if (showTranscript) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // WCAG 2.2: Focus management - move focus to modal when it opens
      setTimeout(() => {
        const closeButton = document.querySelector('[aria-label="Close transcript"]') as HTMLElement;
        if (closeButton) {
          closeButton.focus();
        }
      }, 100);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showTranscript]);

  // Smooth scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Route: /privacy ─────────────────────────────────────────────────────
  if (currentPath === '/privacy') {
    return (
      <Suspense fallback={<div style={{ padding: 24, fontFamily: 'sans-serif' }}>Loading…</div>}>
        <PrivacyPolicy onBack={() => navigateTo('/')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-blue-50 to-white">
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <img 
              src={laneysWorldLogo} 
              alt="Delaney's World" 
              className="w-48 h-auto rounded-2xl"
            />
            {/* Visual spinner — aria-hidden; the sr-only div below is the sole live-region (SC 4.1.3) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
              aria-hidden="true"
            />
            <div 
              role="status" 
              aria-live="polite" 
              className="sr-only"
            >
              Loading Delaney's World. Please wait.
            </div>
          </motion.div>
        </div>
      )}

      {/* Sticky Header — aria-hidden + inert managed by stickyHeaderRef effect (SC 2.1.1) */}
      <motion.header
        ref={stickyHeaderRef as React.RefObject<HTMLElement>}
        aria-hidden="true"
        initial={{ y: -120 }}
        animate={{ y: showStickyHeader ? 0 : -120 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200"
      >
        <nav aria-label="Sticky site navigation">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={scrollToTop}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Scroll to top"
          >
            <img 
              src={laneysWorldLogo} 
              alt="Delaney's World" 
              className="w-16 h-auto rounded-lg"
              width={64}
              height={64}
              loading="eager"
            />
            <span className="hidden sm:inline font-semibold text-gray-900 text-lg">Delaney's World</span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setFeedbackOpenedFrom('sticky_header');
                setShowFeedback(true);
                trackEvent('feedback_button_click', {
                  event_category: 'engagement',
                  event_label: 'sticky_header_feedback_button',
                  button_location: 'sticky_header',
                });
              }}
              className="inline-flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Send us a message"
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Send Us a Message</span>
            </button>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base"
              asChild
            >
              <Link 
                href={DONATION_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackEvent('donate_button_click', { 
                  event_category: 'donation',
                  event_label: 'sticky_header_donate_button',
                  button_location: 'sticky_header'
                })}
              >
                <Heart className="mr-2 h-5 w-5" aria-hidden="true" />
                <span>Donate</span>
              </Link>
            </Button>
          </div>
        </div>
        </nav>
      </motion.header>

      {/* Skip Navigation Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>
      
      <main className="w-full max-w-[100vw]">
      {/* Hero Section */}
      <section aria-labelledby="main-content" className="relative w-full py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
              {/* Laney's World Logo */}
              <div className="flex justify-center lg:justify-start">
                <button 
                  onClick={scrollToTop}
                  className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-2xl"
                  aria-label="Scroll to top"
                >
                  <img 
                    src={laneysWorldLogo} 
                    alt="Delaney's World - Anchored in Love & Joy - BPAN Awareness" 
                    className="w-40 sm:w-48 lg:w-56 h-auto rounded-2xl"
                    width={224}
                    height={224}
                    loading="eager"
                    fetchpriority="high"
                  />
                </button>
              </div>
              
              <h1 id="main-content" className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 leading-tight text-center lg:text-left">
                Meet Delaney. Fight BPAN. Give Hope.
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed text-center lg:text-left">
                Delaney is just one of an estimated 500 children worldwide with BPAN – a rare neurodegenerative disorder. 
                Her joy is contagious. Her fight deserves action. Join us to raise awareness, fund gene therapy research, and change lives.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg text-base min-h-[52px] w-full sm:w-auto"
                  asChild
                >
                  <Link 
                    href={DONATION_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('donate_button_click', { 
                      event_category: 'donation',
                      event_label: 'hero_donate_button',
                      button_location: 'hero_section'
                    })}
                  >
                    <Heart className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">Donate Now – Support Gene Therapy</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="rounded-xl sm:rounded-2xl overflow-hidden">
                <ImageWithFallback
                  src={delaneyDadNewImage}
                  alt="Delaney with her dad - a joyful moment together"
                  className="w-full h-[280px] sm:h-[320px] lg:h-[420px] object-cover"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  width={800}
                  height={600}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Is BPAN Section */}
      <section id="what-is-bpan" aria-labelledby="bpan-heading" className="w-full py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6 bg-white">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-10">
            <h2 id="bpan-heading" className="text-xl sm:text-2xl lg:text-3xl text-gray-900 mb-3 sm:mb-4 px-1">
              What Is BPAN? And Why Haven't You Heard of It?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center">
            <div className="space-y-3 sm:space-y-5">
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                BPAN (Beta-propeller Protein-Associated Neurodegeneration) is caused by a spontaneous 
                mutation in the WDR45 gene. It leads to iron buildup in the brain, causing seizures, 
                developmental delays, and progressive neurodegeneration.
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                Only about 500 children worldwide are affected by BPAN. With awareness low and funding even scarcer, every voice matters – which is why this page exists.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4 mt-6 md:mt-0">
              {/* NIH GARD */}
              <a
                href="https://rarediseases.info.nih.gov/diseases/12570/neurodegeneration-with-brain-iron-accumulation-5"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 sm:gap-4 bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[56px]"
                aria-label="Learn more about BPAN at NIH Genetic and Rare Diseases Information Center (opens in new window)"
                onClick={() => trackEvent('medical_resource_click', {
                  event_category: 'external_resource',
                  event_label: 'nih_gard',
                  resource_type: 'medical_authority',
                  link_location: 'bpan_section'
                })}
              >
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base font-semibold flex-1">NIH Genetic and Rare Diseases</span>
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
              </a>
              
              {/* MedlinePlus Genetics */}
              <a
                href="https://medlineplus.gov/genetics/condition/beta-propeller-protein-associated-neurodegeneration/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 sm:gap-4 bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full hover:bg-green-700 transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[56px]"
                aria-label="Learn about BPAN and WDR45 gene at MedlinePlus Genetics (opens in new window)"
                onClick={() => trackEvent('medical_resource_click', {
                  event_category: 'external_resource',
                  event_label: 'medlineplus_genetics',
                  resource_type: 'medical_authority',
                  link_location: 'bpan_section'
                })}
              >
                <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base font-semibold flex-1">MedlinePlus Genetics</span>
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
              </a>
              
              {/* NCBI GeneReviews */}
              <a
                href="https://www.ncbi.nlm.nih.gov/books/NBK424403/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 sm:gap-4 bg-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full hover:bg-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[56px]"
                aria-label="Read BPAN clinical summary at NCBI GeneReviews (opens in new window)"
                onClick={() => trackEvent('medical_resource_click', {
                  event_category: 'external_resource',
                  event_label: 'ncbi_genereviews',
                  resource_type: 'medical_authority',
                  link_location: 'bpan_section'
                })}
              >
                <BookMarked className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base font-semibold flex-1">NCBI GeneReviews</span>
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* The Science Behind BPAN - Flowchart Section */}
      <section id="science" aria-labelledby="science-heading" className="w-full py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6 bg-gradient-to-b from-blue-50/30 to-white">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-4 sm:mb-6">
            <h2 id="science-heading" className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-2 sm:mb-3 px-1">
              Understanding the Science Behind BPAN
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              How a single gene mutation triggers a cascade leading to BPAN
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click any card to learn more from official medical sources
            </p>
          </div>

          <ScienceFlowchart />
        </div>
      </section>

      {/* Delaney's Story Section */}
      <section id="delaneys-world" aria-labelledby="delaney-heading" className="w-full py-6 sm:py-8 lg:py-10 px-3 sm:px-4 lg:px-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-4 sm:mb-6">
            <h2 id="delaney-heading" className="text-xl sm:text-2xl lg:text-3xl text-gray-900 mb-3 sm:mb-4 px-1 flex items-center justify-center gap-2">
              Delaney's World: Anchored in Love & Joy
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-pink-500 fill-pink-500" />
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 items-start">
            <div className="space-y-2 sm:space-y-3 order-2 lg:order-1">
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                Delaney is {delaneyAge}. She's full of laughter, empathy, and quiet strength. She faces enormous 
                challenges – yet lights up every room with her spirit.
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                She's part of a vibrant community supported by <em><a href="https://www.dontforgetmorgan.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" aria-label="Don't Forget Morgan (opens in new window)" onClick={() => trackEvent('partner_link_click', {
                  event_category: 'external_navigation',
                  event_label: 'dont_forget_morgan',
                  link_location: 'delaneys_story_section',
                  link_type: 'partnership'
                })}>Don't Forget Morgan</a></em>, which partners 
                with Detroit sports teams to raise funds and unite families.
              </p>
              
              {/* Laney's Favorite Things - Title */}
              <div className="text-left pt-1">
                <p className="text-xs sm:text-sm text-purple-600">Laney's Favorite Things</p>
              </div>
              
              {/* Grid of family moments with aligned icons */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                {/* Ice Cream column */}
                <div className="space-y-2">
                  <div className="rounded-lg sm:rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={delaneyIceCreamDadImage}
                      alt="Delaney enjoying ice cream with dad - sweet moments together"
                      className="w-full h-20 sm:h-28 object-cover object-[50%_50%]"
                      loading="lazy"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center" aria-label="Ice cream - one of Delaney's favorites">
                    <svg
                      viewBox="0 0 80 100"
                      className="w-12 h-15 sm:w-16 sm:h-20 transition-transform hover:scale-110"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      focusable="false"
                    >
                      {/* Ice cream cone */}
                      <path
                        d="M 25 45 L 40 90 L 55 45 Z"
                        fill="#D2691E"
                        stroke="#8B4513"
                        strokeWidth="1.5"
                      />
                      {/* Waffle pattern */}
                      <line x1="30" y1="55" x2="50" y2="55" stroke="#8B4513" strokeWidth="0.8" opacity="0.4" />
                      <line x1="32" y1="65" x2="48" y2="65" stroke="#8B4513" strokeWidth="0.8" opacity="0.4" />
                      <line x1="34" y1="75" x2="46" y2="75" stroke="#8B4513" strokeWidth="0.8" opacity="0.4" />
                      <line x1="35" y1="50" x2="40" y2="85" stroke="#8B4513" strokeWidth="0.8" opacity="0.4" />
                      <line x1="45" y1="50" x2="40" y2="85" stroke="#8B4513" strokeWidth="0.8" opacity="0.4" />
                      
                      {/* Pink ice cream scoop (bottom) */}
                      <circle cx="40" cy="38" r="14" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1.5" />
                      {/* Purple ice cream scoop (top) */}
                      <circle cx="40" cy="24" r="14" fill="#DDA0DD" stroke="#BA55D3" strokeWidth="1.5" />
                      
                      {/* Sprinkles */}
                      <rect x="35" y="20" width="2" height="6" fill="#FF1493" rx="1" transform="rotate(15 36 23)" />
                      <rect x="43" y="18" width="2" height="6" fill="#4169E1" rx="1" transform="rotate(-20 44 21)" />
                      <rect x="48" y="25" width="2" height="5" fill="#FFD700" rx="1" transform="rotate(30 49 27)" />
                      <rect x="32" y="28" width="2" height="5" fill="#00CED1" rx="1" transform="rotate(-15 33 30)" />
                      <rect x="45" y="35" width="2" height="5" fill="#FF6347" rx="1" transform="rotate(25 46 37)" />
                      <rect x="37" y="33" width="2" height="5" fill="#9370DB" rx="1" transform="rotate(-30 38 35)" />
                      
                      {/* Cherry on top */}
                      <circle cx="40" cy="12" r="3.5" fill="#DC143C" />
                      <path d="M 40 12 Q 42 6 44 4" stroke="#8B4513" strokeWidth="1.2" fill="none" />
                    </svg>
                    <p className="text-xs text-center text-purple-600 mt-0.5">Ice Cream</p>
                  </div>
                </div>
                
                {/* Music column */}
                <div className="space-y-2">
                  <div className="rounded-lg sm:rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={delaneyGuitarNewImage}
                      alt="Delaney playing guitar - exploring music and creativity"
                      className="w-full h-20 sm:h-28 object-cover"
                      loading="lazy"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center" aria-label="Guitar and music - one of Delaney's favorites">
                    <svg
                      viewBox="0 0 80 100"
                      className="w-12 h-15 sm:w-16 sm:h-20 transition-transform hover:scale-110"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      focusable="false"
                    >
                      {/* Guitar body */}
                      <ellipse cx="40" cy="60" rx="18" ry="22" fill="#DDA0DD" stroke="#BA55D3" strokeWidth="2" />
                      <ellipse cx="40" cy="60" rx="18" ry="22" fill="url(#guitarGradient)" opacity="0.4" />
                      
                      {/* Sound hole */}
                      <circle cx="40" cy="60" r="6" fill="#8B008B" opacity="0.6" />
                      <circle cx="40" cy="60" r="4.5" fill="#4B0082" opacity="0.8" />
                      
                      {/* Sound hole decoration */}
                      <circle cx="40" cy="60" r="5" stroke="#BA55D3" strokeWidth="0.8" fill="none" opacity="0.4" />
                      
                      {/* Guitar neck */}
                      <rect x="35" y="10" width="10" height="35" fill="#8B4513" rx="1" />
                      <rect x="35.5" y="10" width="9" height="35" fill="#A0522D" rx="1" />
                      
                      {/* Frets */}
                      <line x1="35" y1="18" x2="45" y2="18" stroke="#D2691E" strokeWidth="1" opacity="0.6" />
                      <line x1="35" y1="25" x2="45" y2="25" stroke="#D2691E" strokeWidth="1" opacity="0.6" />
                      <line x1="35" y1="32" x2="45" y2="32" stroke="#D2691E" strokeWidth="1" opacity="0.6" />
                      <line x1="35" y1="39" x2="45" y2="39" stroke="#D2691E" strokeWidth="1" opacity="0.6" />
                      
                      {/* Strings */}
                      <line x1="37" y1="10" x2="37" y2="82" stroke="#FFD700" strokeWidth="0.5" opacity="0.7" />
                      <line x1="39" y1="10" x2="39" y2="82" stroke="#FFD700" strokeWidth="0.5" opacity="0.7" />
                      <line x1="41" y1="10" x2="41" y2="82" stroke="#FFD700" strokeWidth="0.5" opacity="0.7" />
                      <line x1="43" y1="10" x2="43" y2="82" stroke="#FFD700" strokeWidth="0.5" opacity="0.7" />
                      
                      {/* Headstock */}
                      <rect x="36" y="5" width="8" height="6" fill="#654321" rx="1" />
                      
                      {/* Tuning pegs */}
                      <circle cx="37.5" cy="7" r="1.2" fill="#C0C0C0" />
                      <circle cx="42.5" cy="7" r="1.2" fill="#C0C0C0" />
                      
                      {/* Bridge */}
                      <rect x="36" y="80" width="8" height="2" fill="#654321" rx="0.5" />
                      
                      {/* Musical notes floating around */}
                      <g opacity="0.8">
                        {/* Note 1 - top left */}
                        <ellipse cx="20" cy="20" rx="2.5" ry="2" fill="#FF69B4" transform="rotate(-20 20 20)" />
                        <line x1="22.3" y1="19" x2="22.3" y2="12" stroke="#FF69B4" strokeWidth="1.5" strokeLinecap="round" />
                        
                        {/* Note 2 - top right */}
                        <ellipse cx="58" cy="25" rx="2.5" ry="2" fill="#4169E1" transform="rotate(15 58 25)" />
                        <line x1="60.3" y1="24" x2="60.3" y2="17" stroke="#4169E1" strokeWidth="1.5" strokeLinecap="round" />
                        
                        {/* Note 3 - middle right with flag */}
                        <ellipse cx="62" cy="50" rx="2.5" ry="2" fill="#9370DB" transform="rotate(-10 62 50)" />
                        <line x1="64.3" y1="49" x2="64.3" y2="42" stroke="#9370DB" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 64.3 42 Q 67 42 67 45" stroke="#9370DB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        
                        {/* Note 4 - bottom left */}
                        <ellipse cx="18" cy="70" rx="2.5" ry="2" fill="#FF6347" transform="rotate(20 18 70)" />
                        <line x1="20.3" y1="69" x2="20.3" y2="62" stroke="#FF6347" strokeWidth="1.5" strokeLinecap="round" />
                      </g>
                      
                      {/* Heart detail on guitar body */}
                      <path d="M 40 56 L 42 54 Q 43 53 43 54.5 Q 43 56 40 58 Q 37 56 37 54.5 Q 37 53 38 54 Z" fill="#FF69B4" opacity="0.6" />
                      
                      {/* Gradients */}
                      <defs>
                        <radialGradient id="guitarGradient">
                          <stop offset="0%" stopColor="#E6B0E6" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#BA55D3" stopOpacity="0.3" />
                        </radialGradient>
                      </defs>
                    </svg>
                    <p className="text-xs text-center text-purple-600 mt-0.5">Music</p>
                  </div>
                </div>
                
                {/* Meatballs column */}
                <div className="space-y-2">
                  <div className="rounded-lg sm:rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={delaneyMeatballsNewImage}
                      alt="Delaney enjoying her favorite meatballs - delicious moments"
                      className="w-full h-20 sm:h-28 object-cover"
                      loading="lazy"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center" aria-label="Meatballs - one of Delaney's favorites">
                    <svg
                      viewBox="0 0 80 100"
                      className="w-12 h-15 sm:w-16 sm:h-20 transition-transform hover:scale-110"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      focusable="false"
                    >
                      {/* Plate */}
                      <ellipse cx="40" cy="75" rx="28" ry="8" fill="#E8E8E8" stroke="#BDBDBD" strokeWidth="2" />
                      <ellipse cx="40" cy="73" rx="28" ry="8" fill="#F5F5F5" />
                      
                      {/* Plate rim highlight */}
                      <ellipse cx="40" cy="71" rx="26" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
                      
                      {/* Spaghetti noodles - wavy lines */}
                      <path d="M 20 65 Q 25 63 30 65 T 40 65 T 50 65 T 60 65" stroke="#F4E4C1" strokeWidth="2.5" fill="none" opacity="0.8" />
                      <path d="M 22 68 Q 27 66 32 68 T 42 68 T 52 68 T 58 68" stroke="#F4E4C1" strokeWidth="2.5" fill="none" opacity="0.7" />
                      <path d="M 25 70 Q 30 69 35 70 T 45 70 T 55 70" stroke="#F4E4C1" strokeWidth="2.5" fill="none" opacity="0.6" />
                      <path d="M 18 67 Q 23 65 28 67 T 38 67 T 48 67" stroke="#F4E4C1" strokeWidth="2" fill="none" opacity="0.5" />
                      
                      {/* Meatballs with shading */}
                      {/* Meatball 1 - back left */}
                      <circle cx="28" cy="58" r="7" fill="#8B4513" />
                      <circle cx="28" cy="58" r="7" fill="url(#meatballGradient)" />
                      <circle cx="26" cy="56" r="1.5" fill="#6B3410" opacity="0.6" />
                      
                      {/* Meatball 2 - back right */}
                      <circle cx="52" cy="60" r="7" fill="#8B4513" />
                      <circle cx="52" cy="60" r="7" fill="url(#meatballGradient)" />
                      <circle cx="50" cy="58" r="1.5" fill="#6B3410" opacity="0.6" />
                      
                      {/* Meatball 3 - front center (hero meatball!) */}
                      <circle cx="40" cy="55" r="9" fill="#8B4513" />
                      <circle cx="40" cy="55" r="9" fill="url(#meatballGradient)" />
                      <circle cx="37" cy="52" r="2" fill="#6B3410" opacity="0.6" />
                      <circle cx="43" cy="54" r="1.5" fill="#6B3410" opacity="0.6" />
                      
                      {/* Highlight on hero meatball */}
                      <circle cx="38" cy="51" r="2.5" fill="#FFFFFF" opacity="0.4" />
                      
                      {/* Marinara sauce splatters */}
                      <circle cx="35" cy="65" r="2" fill="#D32F2F" opacity="0.7" />
                      <circle cx="48" cy="67" r="1.5" fill="#D32F2F" opacity="0.6" />
                      <circle cx="42" cy="66" r="1.8" fill="#D32F2F" opacity="0.65" />
                      <ellipse cx="30" cy="63" rx="2.5" ry="1.5" fill="#D32F2F" opacity="0.5" />
                      
                      {/* Parmesan cheese sprinkles */}
                      <rect x="32" y="60" width="1.5" height="1.5" fill="#FFF9E6" opacity="0.8" rx="0.3" />
                      <rect x="45" y="62" width="1.2" height="1.2" fill="#FFF9E6" opacity="0.7" rx="0.3" />
                      <rect x="38" y="64" width="1.3" height="1.3" fill="#FFF9E6" opacity="0.75" rx="0.3" />
                      <rect x="50" y="65" width="1" height="1" fill="#FFF9E6" opacity="0.65" rx="0.3" />
                      
                      {/* Basil leaf */}
                      <ellipse cx="44" cy="58" rx="3" ry="4.5" fill="#2E7D32" transform="rotate(25 44 58)" />
                      <path d="M 44 55 Q 44 58 44 61" stroke="#1B5E20" strokeWidth="0.5" fill="none" />
                      
                      {/* Steam rising */}
                      <g opacity="0.5">
                        <path d="M 30 50 Q 28 45 30 40" stroke="#BDBDBD" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <path d="M 40 48 Q 38 43 40 38" stroke="#BDBDBD" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <path d="M 50 52 Q 52 47 50 42" stroke="#BDBDBD" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </g>
                      
                      {/* Fork on the side */}
                      <g transform="translate(60, 60)">
                        <rect x="0" y="0" width="2" height="20" fill="#C0C0C0" rx="0.5" />
                        <rect x="-2" y="0" width="1.5" height="8" fill="#C0C0C0" rx="0.3" />
                        <rect x="2.5" y="0" width="1.5" height="8" fill="#C0C0C0" rx="0.3" />
                        <rect x="0" y="18" width="2" height="3" fill="#A9A9A9" rx="1" />
                      </g>
                      
                      {/* Gradients */}
                      <defs>
                        <radialGradient id="meatballGradient">
                          <stop offset="0%" stopColor="#A0522D" stopOpacity="0.4" />
                          <stop offset="50%" stopColor="#8B4513" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#654321" stopOpacity="0.8" />
                        </radialGradient>
                      </defs>
                    </svg>
                    <p className="text-xs text-center text-purple-600 mt-0.5">Meatballs</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3 order-1 lg:order-2">
              {/* Main featured video */}
              <div className="relative">
                <LiteYouTube
                    videoId="xbpCgGgdjWk"
                    title="Delaney's joyful moment - a glimpse into her world"
                    heightClass="h-[200px] sm:h-[240px] lg:h-[280px]"
                  />
                {/* Video accessibility notice */}
                <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
                  Captions available. <button 
                    onClick={() => {
                      setShowTranscript(true);
                      trackEvent('video_transcript_open', {
                        event_category: 'content_engagement',
                        event_label: 'delaney_video_transcript',
                        video_location: 'delaneys_story_section'
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer bg-transparent border-0 p-0 font-inherit"
                    aria-label="View full video transcript"
                  >View transcript</button> | <a href="https://www.youtube.com/watch?v=xbpCgGgdjWk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" onClick={() => trackEvent('youtube_external_click', {
                    event_category: 'video_engagement',
                    event_label: 'delaney_video_youtube',
                    video_id: 'xbpCgGgdjWk',
                    link_location: 'delaneys_story_section'
                  })}>Watch on YouTube<span className="sr-only"> (opens in new window)</span></a>
                </p>
              </div>
            </div>
          </div>
          
          {/* Poem from Delaney's Grandfather */}
          <div className="mt-6 sm:mt-8 lg:mt-10">
            {/* Option C: Pull-Quote Magazine Style */}
            <div className="relative pl-8 sm:pl-12 pr-4 sm:pr-8 py-10 bg-gradient-to-r from-purple-50 to-transparent">
              {/* Large left accent border */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-600 via-pink-600 to-purple-600"></div>
              
              {/* Opening quote mark - large and decorative */}
              <div className="text-purple-500 text-7xl sm:text-8xl leading-none mb-6 font-serif opacity-30 absolute -top-4 left-8">
                "
              </div>
              
              <div className="relative z-10 pt-8">
                <h3 className="text-2xl sm:text-3xl text-gray-900 mb-8 font-serif italic text-center sm:text-left">
                  Delaney's World
                </h3>
                
                <AnimatedPoem />
                
                {/* Closing quote and attribution */}
                <div className="mt-8 flex items-end justify-between">
                  <div className="text-purple-500 text-7xl leading-none font-serif opacity-30">"</div>
                  <div className="text-right">
                    <div className="w-24 h-px bg-purple-400 ml-auto mb-2"></div>
                    <p className="text-base sm:text-lg text-gray-600 font-serif italic">
                      <cite>Colin, Delaney's Grandfather</cite>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Moments from Delaney's World - Photo Gallery */}
      <section id="moments" aria-labelledby="moments-heading" className="w-full py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-4 sm:mb-6">
            <h2 id="moments-heading" className="text-xl sm:text-2xl lg:text-3xl text-gray-900 mb-2 px-1">
              Moments from Delaney's World
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              A celebration of joy, love, and the beauty of every day
            </p>
          </div>
          
          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            {/* Swing photo */}
            <div className="group relative rounded-lg sm:rounded-xl overflow-hidden aspect-square">
              <ImageWithFallback
                src={delaneySwingImage}
                alt="Delaney on the swing - pure joy and freedom in the fall"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={600}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Kitchen photo */}
            <div className="group relative rounded-lg sm:rounded-xl overflow-hidden aspect-square">
              <ImageWithFallback
                src={delaneyKitchenImage}
                alt="Delaney smiling in the kitchen - pure happiness"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={600}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Face paint photo */}
            <div className="group relative rounded-lg sm:rounded-xl overflow-hidden aspect-square">
              <ImageWithFallback
                src={delaneyFacePaintImage}
                alt="Delaney with beautiful face paint - creative expression"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={600}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Beach photo */}
            <div className="group relative rounded-lg sm:rounded-xl overflow-hidden aspect-square">
              <ImageWithFallback
                src={delaneyFamBeachImage}
                alt="Delaney with her family at the beach - summer adventures"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={600}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Dad photo */}
            <div className="group relative rounded-lg sm:rounded-xl overflow-hidden aspect-square">
              <ImageWithFallback
                src={delaneyDadSunsetHeroImage}
                alt="Delaney with her dad - a joyful moment together"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={600}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Family farm photo */}
            <div className="group relative rounded-lg sm:rounded-xl overflow-hidden aspect-square">
              <ImageWithFallback
                src={delaneyFamilyFarmImage}
                alt="Delaney with her family - creating precious memories together"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={600}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Gene Therapy News Section */}
      <section id="research" aria-labelledby="research-heading" className="w-full py-8 sm:py-10 lg:py-12 px-3 sm:px-4 lg:px-6 bg-white scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-8">
            <h2 id="research-heading" className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 px-1">
              Recent Breakthroughs in Gene Therapy Research
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mt-2">
              Exciting progress in BPAN research. <a 
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium"
                onClick={() => trackEvent('donate_button_click', { 
                  event_category: 'donation',
                  event_label: 'research_section_inline_link',
                  button_location: 'research_section'
                })}
              >
                Your donation helps fund this vital work
              </a>.
            </p>
            {/* Last Updated Indicator */}
            <p className="text-xs text-gray-400 mt-2">
              Last updated: {lastUpdated}
            </p>
          </div>
          
          {/* Essential Medical Resource Spotlight - Moved to Top */}
          {researchArticles
            .filter(article => article.spotlight)
            .map((article) => (
              <div key={article.id} className="mb-5 sm:mb-6">
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label={`${article.title} - Read more at ${article.sourceText} (opens in new window)`}
                  onClick={() => trackEvent('research_article_click', {
                    event_category: 'content_engagement',
                    event_label: article.sourceText,
                    article_title: article.title,
                    is_spotlight: 'true',
                    link_location: 'research_section'
                  })}
                >
                  <Card className="p-3 sm:p-4 border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-white hover:border-blue-500 transition-all cursor-pointer min-h-[140px]">
                    <CardContent className="p-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-blue-600" aria-hidden="true" />
                              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Essential Resource</span>
                            </div>
                            <span className="text-sm text-gray-700">{article.sourceText}</span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                            {article.title}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                            {article.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </div>
            ))}
          
          {/* Featured Articles */}
          {researchArticles
            .filter(article => article.featured)
            .map((article) => (
              <div key={article.id} className="mb-5 sm:mb-6">
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label={`${article.title} - Read more at ${article.sourceText} (opens in new window)`}
                  onClick={() => trackEvent('research_article_click', {
                    event_category: 'content_engagement',
                    event_label: article.sourceText,
                    article_title: article.title,
                    is_featured: 'true',
                    link_location: 'research_section'
                  })}
                >
                  <Card className="p-3 sm:p-4 border border-gray-200 hover:border-gray-400 transition-all cursor-pointer min-h-[100px]">
                    <CardContent className="p-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Star className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                            <span className="text-sm text-gray-700">{article.sourceText}</span>
                          </div>
                          <h3 className="text-lg sm:text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </div>
            ))}

          {/* Research Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {researchArticles
              .filter(article => !article.featured && !article.spotlight)
              .slice(0, 6)
              .map((article) => (
                <a
                  key={article.id}
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label={`${article.title} - Read more at ${article.sourceText} (opens in new window)`}
                  onClick={() => trackEvent('research_article_click', {
                    event_category: 'content_engagement',
                    event_label: article.sourceText,
                    article_title: article.title,
                    is_featured: 'false',
                    link_location: 'research_section'
                  })}
                >
                  <Card className="p-3 border border-gray-200 hover:border-gray-400 transition-all cursor-pointer h-full">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="mb-1.5">
                        <span className="text-sm text-gray-700">{article.sourceText}</span>
                      </div>
                      <h4 className="text-base sm:text-lg text-gray-900 group-hover:text-blue-600 transition-colors leading-snug flex-1">
                        {article.title}
                      </h4>
                    </CardContent>
                  </Card>
                </a>
              ))}
          </div>
        </div>
      </section>

      {/* Centers of Excellence Section */}
      <section id="centers-of-excellence" aria-labelledby="centers-heading" className="w-full py-8 sm:py-10 lg:py-12 px-3 sm:px-4 lg:px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <Hospital className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" aria-hidden="true" />
              <h2 id="centers-heading" className="text-xl sm:text-2xl lg:text-3xl text-gray-900">
                Find Expert Care
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto px-2">
              U.S. Centers of Excellence vetted by the NBIA Disorders Association for specialized multidisciplinary expertise
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* OHSU */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 sm:p-5 min-h-[140px] sm:min-h-[160px] flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Hospital className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-md">PKAN/BPAN</span>
                  </div>
                  <h3 className="text-base sm:text-lg leading-tight min-h-[44px] flex items-center">
                    Oregon Health & Science University
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm mt-auto text-blue-100">
                    <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>Portland, OR</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Longest-standing NBIA research hub globally. Primary contact for PKAN clinical trials and natural history studies.
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Key Experts</h4>
                    <p className="text-sm text-gray-700">Dr. Susan Hayflick, Dr. Penny Hogarth</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Coordinator</h4>
                    <p className="text-sm text-gray-700">Allison Gregory, MS, CGC</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Contact</h4>
                    <div className="space-y-2">
                      <a 
                        href="tel:503-494-7703"
                        className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_contact', {
                          event_category: 'medical_resource',
                          event_label: 'ohsu_phone',
                          center_name: 'OHSU',
                          contact_type: 'phone'
                        })}
                      >
                        <Phone className="h-5 w-5 flex-shrink-0 text-blue-600" aria-hidden="true" />
                        <span className="font-medium">503-494-7703</span>
                      </a>
                      <a 
                        href="mailto:info@nbiacure.org"
                        className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_contact', {
                          event_category: 'medical_resource',
                          event_label: 'ohsu_email',
                          center_name: 'OHSU',
                          contact_type: 'email'
                        })}
                      >
                        <Mail className="h-5 w-5 flex-shrink-0 text-blue-600" aria-hidden="true" />
                        <span className="font-medium break-all">info@nbiacure.org</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Resources</h4>
                    <div className="space-y-2">
                      <a 
                        href="https://nbiacure.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors p-3 rounded-lg hover:bg-blue-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_website', {
                          event_category: 'medical_resource',
                          event_label: 'ohsu_nbiacure',
                          center_name: 'OHSU',
                          link_type: 'research_portal'
                        })}
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium">NBIAcure.org Research Portal</span>
                      </a>
                      <a 
                        href="https://www.ohsu.edu/brain-institute"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors p-3 rounded-lg hover:bg-blue-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_website', {
                          event_category: 'medical_resource',
                          event_label: 'ohsu_brain_institute',
                          center_name: 'OHSU',
                          link_type: 'hospital_page'
                        })}
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium">OHSU Brain Institute</span>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CHOP */}
            <Card className="overflow-hidden border-2 border-green-600">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-green-600 text-white p-4 sm:p-5 min-h-[140px] sm:min-h-[160px] flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Hospital className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-white" aria-hidden="true" />
                      BPAN Leader
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg leading-tight min-h-[44px] flex items-center">
                    Children's Hospital of Philadelphia
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm mt-auto text-green-100">
                    <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>Philadelphia, PA</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong className="text-green-700">Global leader for BPAN care.</strong> Dedicated multidisciplinary BPAN clinic integrating neurology, genetics, and therapies.
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Key Experts</h4>
                    <p className="text-sm text-gray-700">Dr. Laura Adang, Dr. Joseph Vithayathil</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Coordinator</h4>
                    <p className="text-sm text-gray-700">Victoria Lawler</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Contact</h4>
                    <div className="space-y-2">
                      <a 
                        href="tel:267-426-0716"
                        className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-green-600 transition-colors p-3 rounded-lg hover:bg-green-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_contact', {
                          event_category: 'medical_resource',
                          event_label: 'chop_phone',
                          center_name: 'CHOP',
                          contact_type: 'phone'
                        })}
                      >
                        <Phone className="h-5 w-5 flex-shrink-0 text-green-600" aria-hidden="true" />
                        <span className="font-medium">267-426-0716</span>
                      </a>
                      <a 
                        href="mailto:bpan@chop.edu"
                        className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-green-600 transition-colors p-3 rounded-lg hover:bg-green-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_contact', {
                          event_category: 'medical_resource',
                          event_label: 'chop_email',
                          center_name: 'CHOP',
                          contact_type: 'email'
                        })}
                      >
                        <Mail className="h-5 w-5 flex-shrink-0 text-green-600" aria-hidden="true" />
                        <span className="font-medium break-all">bpan@chop.edu</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Resources</h4>
                    <div className="space-y-2">
                      <a 
                        href="https://www.chop.edu/centers-programs/clinic-bpan-and-wdr45-related-disorders"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors p-3.5 rounded-lg shadow-md hover:shadow-lg min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_website', {
                          event_category: 'medical_resource',
                          event_label: 'chop_bpan_clinic',
                          center_name: 'CHOP',
                          link_type: 'specialty_clinic'
                        })}
                      >
                        <Star className="h-4 w-4 flex-shrink-0 fill-white" aria-hidden="true" />
                        <span>BPAN Specialty Clinic Details</span>
                        <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Texas Children's */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-orange-600 text-white p-4 sm:p-5 min-h-[140px] sm:min-h-[160px] flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Hospital className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-md">Pediatric</span>
                  </div>
                  <h3 className="text-base sm:text-lg leading-tight min-h-[44px] flex items-center">
                    Texas Children's Hospital
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm mt-auto text-orange-100">
                    <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>Houston, TX</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Major center for pediatric movement disorders and complex NBIA cases, including undiagnosed presentations.
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Key Experts</h4>
                    <p className="text-sm text-gray-700">Dr. Mariam Hull, Dr. Monica Emrick</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Clinic</h4>
                    <p className="text-sm text-gray-700">Blue Bird Circle Clinic</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Contact</h4>
                    <div className="space-y-2">
                      <a 
                        href="tel:832-822-1750"
                        className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-orange-600 transition-colors p-3 rounded-lg hover:bg-orange-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_contact', {
                          event_category: 'medical_resource',
                          event_label: 'texas_childrens_phone',
                          center_name: 'Texas_Childrens',
                          contact_type: 'phone'
                        })}
                      >
                        <Phone className="h-5 w-5 flex-shrink-0 text-orange-600" aria-hidden="true" />
                        <span className="font-medium">832-822-1750</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Resources</h4>
                    <div className="space-y-2">
                      <a 
                        href="https://www.texaschildrens.org/departments/neurology"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-orange-600 hover:text-orange-700 hover:underline transition-colors p-3 rounded-lg hover:bg-orange-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_website', {
                          event_category: 'medical_resource',
                          event_label: 'texas_childrens_neurology',
                          center_name: 'Texas_Childrens',
                          link_type: 'neurology_department'
                        })}
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium">Neurology Department</span>
                      </a>
                      <a 
                        href="https://www.texaschildrens.org/departments/neurology/programs-and-services"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-orange-600 hover:text-orange-700 hover:underline transition-colors p-3 rounded-lg hover:bg-orange-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_website', {
                          event_category: 'medical_resource',
                          event_label: 'texas_childrens_programs_services',
                          center_name: 'Texas_Childrens',
                          link_type: 'programs_services'
                        })}
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium">Programs & Services</span>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UC Davis MIND */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-purple-600 text-white p-4 sm:p-5 min-h-[140px] sm:min-h-[160px] flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Hospital className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-md">New 2025</span>
                  </div>
                  <h3 className="text-base sm:text-lg leading-tight min-h-[44px] flex items-center">
                    UC Davis MIND Institute
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm mt-auto text-purple-100">
                    <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>Sacramento, CA</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Newest center focusing on neurodevelopmental delays and rare genetic disorders with precision medicine approach.
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Key Expert</h4>
                    <p className="text-sm text-gray-700">Dr. Suma Shankar</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Focus</h4>
                    <p className="text-sm text-gray-700">West Coast regional care</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Contact</h4>
                    <div className="space-y-2">
                      <a 
                        href="tel:800-482-3284"
                        className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-purple-600 transition-colors p-3 rounded-lg hover:bg-purple-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_contact', {
                          event_category: 'medical_resource',
                          event_label: 'ucdavis_phone_referral',
                          center_name: 'UC_Davis',
                          contact_type: 'phone'
                        })}
                      >
                        <Phone className="h-5 w-5 flex-shrink-0 text-purple-600" aria-hidden="true" />
                        <span className="font-medium">800-4-UCDAVIS</span>
                      </a>
                      <a 
                        href="tel:916-703-0300"
                        className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-purple-600 transition-colors p-3 rounded-lg hover:bg-purple-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_contact', {
                          event_category: 'medical_resource',
                          event_label: 'ucdavis_phone_clinic',
                          center_name: 'UC_Davis',
                          contact_type: 'phone'
                        })}
                      >
                        <Phone className="h-5 w-5 flex-shrink-0 text-purple-600" aria-hidden="true" />
                        <span className="font-medium">916-703-0300 (Clinic)</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Resources</h4>
                    <div className="space-y-2">
                      <a 
                        href="https://health.ucdavis.edu/mind-institute/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-purple-600 hover:text-purple-700 hover:underline transition-colors p-3 rounded-lg hover:bg-purple-50 -mx-3 min-h-[44px]"
                        onClick={() => trackEvent('center_of_excellence_website', {
                          event_category: 'medical_resource',
                          event_label: 'ucdavis_mind_institute',
                          center_name: 'UC_Davis',
                          link_type: 'main_site'
                        })}
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium">UC Davis MIND Institute</span>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-xs sm:text-sm text-center text-gray-500 mt-6 px-2">
            These centers provide comprehensive, specialized care for BPAN and related NBIA disorders. Contact them directly for referrals and appointments.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="final-cta" aria-labelledby="final-cta-heading" className="w-full py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto w-full text-center">
          <h2 id="final-cta-heading" className="text-xl sm:text-2xl lg:text-3xl text-white mb-3 sm:mb-5 px-1 leading-tight">
            You Can Change a Child's Future – Starting with Delaney
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-blue-100 mb-5 sm:mb-7 leading-relaxed px-1">
            Your tax-deductible donation supports breakthrough research, connects families, and spreads hope.
          </p>
          
          <div className="flex flex-col gap-4 justify-center items-center mb-6 sm:mb-7">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-4 rounded-lg text-base min-h-[52px] w-full max-w-sm"
              asChild
            >
              <Link 
                href={DONATION_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackEvent('donate_button_click', { 
                  event_category: 'donation',
                  event_label: 'final_cta_donate_button',
                  button_location: 'final_cta_section'
                })}
              >
                <Heart className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">Donate Now – Support Gene Therapy</span>
              </Link>
            </Button>
          </div>
          
          {/* One-tap Share button — Web Share API with clipboard fallback */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={shareStory}
              className="inline-flex items-center gap-2 border-2 border-white/60 hover:border-white text-white hover:bg-white/10 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 min-h-[44px]"
              aria-label="Share Delaney's story — opens share dialog or copies link"
            >
              <Share2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              Share Delaney's Story
            </button>
            <p className="text-xs text-blue-200">
              Every share reaches someone who hasn't heard of BPAN yet.
            </p>
          </div>
        </div>
      </section>


      </main>
      
      {/* Footer */}
      <footer className="w-full py-6 sm:py-7 pb-28 sm:pb-24 px-4 sm:px-4 lg:px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto w-full text-center space-y-4 sm:space-y-5">
          {/* Footer Logo */}
          <div className="flex justify-center">
            <img 
              src={laneysWorldLogo} 
              alt="Delaney's World - Anchored in Love & Joy" 
              className="w-28 sm:w-32 h-auto rounded-2xl opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300"
              width={128}
              height={128}
              loading="lazy"
            />
          </div>
          
          <p className="text-gray-200 text-sm sm:text-sm px-1 leading-relaxed">
            © {new Date().getFullYear()} Delaney's World. All rights reserved.<br className="sm:hidden" />
            <span className="hidden sm:inline"> | </span>In partnership with <a href="https://www.dontforgetmorgan.org/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100 underline" onClick={() => trackEvent('partner_link_click', {
              event_category: 'external_navigation',
              event_label: 'dont_forget_morgan',
              link_location: 'footer',
              link_type: 'partnership'
            })}>Don't Forget Morgan<span className="sr-only"> (opens in new window)</span></a>
          </p>
          <div className="space-y-2">
            <p className="text-gray-200 text-sm sm:text-base font-semibold">
              Follow Delaney's Journey
            </p>
            <div className="flex items-center justify-center gap-5 sm:gap-6 flex-wrap">
              <a 
                href="https://www.instagram.com/eefahmd/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                aria-label="Instagram profile for Erin (Mom)"
                onClick={() => trackEvent('social_media_click', {
                  event_category: 'social_engagement',
                  event_label: 'instagram_mom',
                  platform: 'instagram',
                  profile_owner: 'erin',
                  link_location: 'footer'
                })}
              >
                <Instagram className="h-6 w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="text-sm sm:text-base" aria-hidden="true">@eefahmd</span>
                <span className="sr-only"> (opens in new window)</span>
              </a>
              <span className="text-gray-500" aria-hidden="true">•</span>
              <a 
                href="https://www.instagram.com/instajamman12/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                aria-label="Instagram profile for Kyle (Dad)"
                onClick={() => trackEvent('social_media_click', {
                  event_category: 'social_engagement',
                  event_label: 'instagram_dad',
                  platform: 'instagram',
                  profile_owner: 'kyle',
                  link_location: 'footer'
                })}
              >
                <Instagram className="h-6 w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="text-sm sm:text-base" aria-hidden="true">@instajamman12</span>
                <span className="sr-only"> (opens in new window)</span>
              </a>
              <span className="text-gray-500" aria-hidden="true">•</span>
              <a 
                href="https://x.com/theprecipice12" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                aria-label="X (Twitter) profile for Kyle"
                onClick={() => trackEvent('social_media_click', {
                  event_category: 'social_engagement',
                  event_label: 'x_dad',
                  platform: 'x_twitter',
                  profile_owner: 'kyle',
                  link_location: 'footer'
                })}
              >
                <X className="h-6 w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="text-sm sm:text-base" aria-hidden="true">@theprecipice12</span>
                <span className="sr-only"> (opens in new window)</span>
              </a>
              <span className="text-gray-500" aria-hidden="true">•</span>
              <a 
                href="https://www.facebook.com/erin.faherty.7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                aria-label="Facebook profile for Erin (Mom)"
                onClick={() => trackEvent('social_media_click', {
                  event_category: 'social_engagement',
                  event_label: 'facebook_mom',
                  platform: 'facebook',
                  profile_owner: 'erin',
                  link_location: 'footer'
                })}
              >
                <Facebook className="h-6 w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="text-sm sm:text-base" aria-hidden="true">Erin Faherty, M.D.</span>
                <span className="sr-only"> (opens in new window)</span>
              </a>
              <span className="text-gray-500" aria-hidden="true">•</span>
              <a 
                href="https://www.facebook.com/kallen1286" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-blue-100 transition-colors group"
                aria-label="Facebook profile for Kyle (Dad)"
                onClick={() => trackEvent('social_media_click', {
                  event_category: 'social_engagement',
                  event_label: 'facebook_dad',
                  platform: 'facebook',
                  profile_owner: 'kyle',
                  link_location: 'footer'
                })}
              >
                <Facebook className="h-6 w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="text-sm sm:text-base" aria-hidden="true">Kyle Allen</span>
                <span className="sr-only"> (opens in new window)</span>
              </a>
            </div>
          </div>
          <p className="text-gray-200 text-xs sm:text-sm">
            Proudly based in <a 
              href="https://www.experiencefairfieldct.org/calendar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-blue-100 underline transition-colors"
            >
              Fairfield, Connecticut<span className="sr-only"> (opens in new window)</span>
            </a>
          </p>
          <p className="text-gray-300 text-xs italic">
            Music: <a 
              href="https://creativecommons.org/licenses/by/4.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-200 underline"
            >
              Acoustic Guitar 1 by Audionautix (CC BY 4.0)
            </a>
          </p>
          {/* Contact / Feedback */}
          <div className="pt-1">
            <button
              onClick={() => {
                setFeedbackOpenedFrom('footer');
                setShowFeedback(true);
                trackEvent('feedback_button_click', {
                  event_category: 'engagement',
                  event_label: 'footer_feedback_button',
                  button_location: 'footer',
                });
              }}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
              aria-label="Open contact form"
            >
              <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Send Us a Message</span>
            </button>
          </div>

          {/* Privacy Policy link */}
          <div className="pt-1">
            <button
              onClick={() => navigateTo('/privacy')}
              className="text-gray-500 hover:text-gray-300 text-xs underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
            >
              Privacy Policy &amp; Intellectual Property Notice
            </button>
          </div>

          {/* 501(c)(3) Nonprofit Disclosure */}
          <p className="text-gray-400 text-xs leading-relaxed max-w-3xl mx-auto px-2 mt-4 pt-4 border-t border-gray-700">
            The Don't Forget Me Foundation is a nonprofit, tax-exempt charitable organization under Section 501(c)(3) of the Internal Revenue Code. Donations are tax-deductible as allowed by law (Tax ID 84-3358278).
          </p>
          {/* Medical Disclaimer - E-E-A-T Compliance */}
          <p className="text-gray-400 text-xs leading-relaxed max-w-3xl mx-auto px-2 mt-4 pt-4 border-t border-gray-700">
            <strong className="text-gray-300">Medical Disclaimer:</strong> The information provided on this website is for educational and awareness purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website.
          </p>
        </div>
      </footer>

      {/* Feedback Modal */}
      {showFeedback && (
        <Suspense fallback={null}>
          <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} openedFrom={feedbackOpenedFrom} />
        </Suspense>
      )}
      <Toaster position="bottom-center" richColors />

      {/* Video Transcript Modal */}
      {showTranscript && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setShowTranscript(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transcript-title"
          aria-describedby="transcript-description"
        >
          {/* SC 2.1.2: Focus trap — Tab and Shift+Tab cycle within the modal */}
          <div 
            ref={transcriptModalRef}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return;
              const focusable = transcriptModalRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              if (!focusable || focusable.length === 0) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
              } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
              }
            }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 id="transcript-title" className="text-xl sm:text-2xl text-gray-900">
                Video Transcript: Delaney's Joyful Moment
              </h2>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                aria-label="Close transcript"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5">
              <div id="transcript-description" className="prose prose-sm sm:prose max-w-none text-gray-700">
                <p className="text-sm sm:text-base leading-relaxed mb-4">
                  <strong>Scene:</strong> A heartwarming moment capturing Delaney's spirit and joy.
                </p>
                <p className="text-sm sm:text-base leading-relaxed mb-4">
                  The video shows Delaney engaged in a moment of pure happiness, demonstrating the love and joy that define her world. Despite the challenges of BPAN, her infectious smile and warm personality shine through, reminding us of the beautiful person at the heart of this journey.
                </p>
                <p className="text-sm sm:text-base leading-relaxed mb-4">
                  <strong>Background music:</strong> Acoustic Guitar 1 by Audionautix (licensed under Creative Commons CC BY 4.0)
                </p>
                <p className="text-xs text-gray-500 italic">
                  Note: This is a general description. For the complete audio content, please enable captions when watching the <a 
                    href="https://www.youtube.com/watch?v=xbpCgGgdjWk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >video on YouTube<span className="sr-only"> (opens in new window)</span></a>.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <Button
                onClick={() => setShowTranscript(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}