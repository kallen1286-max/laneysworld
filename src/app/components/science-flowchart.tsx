import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Dna, AlertTriangle, XCircle, Brain, Microscope, ArrowRight, ExternalLink, ArrowDown } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

// Official medical/scientific sources for each card
const SOURCES = {
  gene: {
    url: 'https://medlineplus.gov/genetics/gene/wdr45/',
    title: 'MedlinePlus: WDR45 Gene',
    text: 'Patient-friendly WDR45 gene information'
  },
  mutation: {
    url: 'https://medlineplus.gov/genetics/condition/beta-propeller-protein-associated-neurodegeneration/',
    title: 'MedlinePlus: BPAN Genetics',
    text: 'Understanding BPAN and WDR45 mutations'
  },
  problem: {
    url: 'https://medlineplus.gov/genetics/condition/beta-propeller-protein-associated-neurodegeneration/#causes',
    title: 'MedlinePlus: BPAN Causes',
    text: 'How WDR45 mutations affect cellular function'
  },
  result: {
    url: 'https://medlineplus.gov/genetics/condition/beta-propeller-protein-associated-neurodegeneration/#frequency',
    title: 'MedlinePlus: BPAN Symptoms',
    text: 'Clinical features and iron accumulation'
  },
  hope: {
    url: 'https://www.dontforgetmorgan.org/research',
    title: 'MedlinePlus: Gene Therapy',
    text: 'Understanding gene therapy approaches'
  }
};

const DONATION_URL = 'https://www.gofundme.com/f/morgans-fight-to-find-a-cure-for-bpan';

export function ScienceFlowchart() {
  return (
    <>
      {/* Desktop: Horizontal Flowchart (Row 1: Steps 1-2, Row 2: Steps 3-4) */}
      <div className="hidden lg:block space-y-4">
        {/* Row 1: Gene → Mutation */}
        <div className="flex items-stretch justify-center gap-2">
          {/* Step 1: The Gene */}
          <motion.a
            href={SOURCES.gene.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 max-w-[280px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
            onClick={() => trackEvent('science_source_click', {
              event_category: 'content_engagement',
              event_label: 'wdr45_gene_source',
              link_location: 'science_flowchart'
            })}
          >
            <Card className="h-full border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white hover:border-blue-500 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 flex flex-col h-full relative">
                <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                  1
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Dna className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1.5">
                  The Gene
                </h3>
                <div className="bg-blue-100 rounded-md px-2 py-1 mb-1.5">
                  <p className="text-sm font-semibold text-blue-900 text-center">
                    WDR45 Gene
                  </p>
                </div>
                <p className="text-sm text-gray-600 leading-snug text-center flex-1 mb-1.5">
                  Provides instructions for <span className="font-medium text-blue-800">autophagy</span>—cellular cleanup
                </p>
                <div className="flex items-center justify-center gap-1 text-blue-600 text-xs font-medium group-hover:text-blue-800">
                  <ExternalLink className="h-3 w-3" />
                  <span>Learn more</span>
                </div>
              </CardContent>
            </Card>
          </motion.a>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>

          {/* Step 2: The Mutation */}
          <motion.a
            href={SOURCES.mutation.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex-1 max-w-[280px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-xl"
            onClick={() => trackEvent('science_source_click', {
              event_category: 'content_engagement',
              event_label: 'spontaneous_mutation_source',
              link_location: 'science_flowchart'
            })}
          >
            <Card className="h-full border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white hover:border-orange-500 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 flex flex-col h-full relative">
                <div className="absolute top-1.5 right-1.5 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                  2
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1.5">
                  The Mutation
                </h3>
                <div className="bg-orange-100 rounded-md px-2 py-1 mb-1.5">
                  <p className="text-sm font-semibold text-orange-900 text-center">
                    Spontaneous Change
                  </p>
                </div>
                <p className="text-sm text-gray-600 leading-snug text-center flex-1 mb-1.5">
                  Random mutation <span className="font-medium text-orange-800">not inherited</span>—disrupts the gene
                </p>
                <div className="flex items-center justify-center gap-1 text-orange-600 text-xs font-medium group-hover:text-orange-800">
                  <ExternalLink className="h-3 w-3" />
                  <span>Learn more</span>
                </div>
              </CardContent>
            </Card>
          </motion.a>
        </div>

        {/* Center Arrow pointing down */}
        <div className="flex items-center justify-center py-1">
          <ArrowDown className="h-6 w-6 text-gray-400" aria-hidden="true" />
        </div>

        {/* Row 2: Problem → Result */}
        <div className="flex items-stretch justify-center gap-2">
          {/* Step 3: The Problem */}
          <motion.a
            href={SOURCES.problem.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex-1 max-w-[280px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-xl"
            onClick={() => trackEvent('science_source_click', {
              event_category: 'content_engagement',
              event_label: 'autophagy_disruption_source',
              link_location: 'science_flowchart'
            })}
          >
            <Card className="h-full border-2 border-red-300 bg-gradient-to-br from-red-50 to-white hover:border-red-500 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 flex flex-col h-full relative">
                <div className="absolute top-1.5 right-1.5 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                  3
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <XCircle className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1.5">
                  The Problem
                </h3>
                <div className="bg-red-100 rounded-md px-2 py-1 mb-1.5">
                  <p className="text-sm font-semibold text-red-900 text-center">
                    Autophagy Fails
                  </p>
                </div>
                <p className="text-sm text-gray-600 leading-snug text-center flex-1 mb-1.5">
                  Cells can't <span className="font-medium text-red-800">recycle proteins</span>, affecting brain cells
                </p>
                <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-medium group-hover:text-red-800">
                  <ExternalLink className="h-3 w-3" />
                  <span>Learn more</span>
                </div>
              </CardContent>
            </Card>
          </motion.a>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>

          {/* Step 4: The Result */}
          <motion.a
            href={SOURCES.result.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex-1 max-w-[280px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-xl"
            onClick={() => trackEvent('science_source_click', {
              event_category: 'content_engagement',
              event_label: 'iron_accumulation_source',
              link_location: 'science_flowchart'
            })}
          >
            <Card className="h-full border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white hover:border-purple-500 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 flex flex-col h-full relative">
                <div className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                  4
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1.5">
                  The Result
                </h3>
                <div className="bg-purple-100 rounded-md px-2 py-1 mb-1.5">
                  <p className="text-sm font-semibold text-purple-900 text-center">
                    Iron Buildup
                  </p>
                </div>
                <p className="text-sm text-gray-600 leading-snug text-center flex-1 mb-1.5">
                  Iron accumulates in <span className="font-medium text-purple-800">basal ganglia</span>, causing symptoms
                </p>
                <div className="flex items-center justify-center gap-1 text-purple-600 text-xs font-medium group-hover:text-purple-800">
                  <ExternalLink className="h-3 w-3" />
                  <span>Learn more</span>
                </div>
              </CardContent>
            </Card>
          </motion.a>
        </div>

        {/* Arrow down to Hope */}
        <div className="flex items-center justify-center py-1">
          <ArrowDown className="h-6 w-6 text-gray-400" aria-hidden="true" />
        </div>

        {/* Step 5: The Hope - Full Width */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="w-full max-w-2xl group"
          >
            <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white hover:border-green-500 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-3 relative">
                <div className="absolute top-1.5 right-1.5 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                  5
                </div>
                <div className="flex items-center justify-center flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Microscope className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                    The Hope: Gene Therapy Research
                  </h3>
                  <div className="bg-green-100 rounded-md px-2.5 py-1 mb-1.5 inline-block">
                    <p className="text-sm font-semibold text-green-900">
                      Correcting or compensating for the WDR45 mutation
                    </p>
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed mb-1.5">
                    Scientists are developing gene therapy to restore WDR45 function, potentially <span className="font-medium text-green-800">stopping or reversing</span> the disease.{' '}
                    <a 
                      href="#research"
                      className="text-green-600 hover:text-green-800 underline font-semibold inline-flex items-center gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        trackEvent('internal_navigation', {
                          event_category: 'content_engagement',
                          event_label: 'science_to_research_section',
                          link_location: 'science_flowchart'
                        });
                        document.getElementById('research')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      View recent breakthroughs
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Mobile: Vertical Stack with Arrows */}
      <div className="lg:hidden space-y-2">
        {[
          { source: SOURCES.gene, num: 1, color: 'blue', icon: Dna, title: 'The Gene', badge: 'WDR45 Gene', text: 'Provides instructions for', highlight: 'autophagy', suffix: '—cellular cleanup', label: 'wdr45_gene_source' },
          { source: SOURCES.mutation, num: 2, color: 'orange', icon: AlertTriangle, title: 'The Mutation', badge: 'Spontaneous Change', text: 'Random mutation', highlight: 'not inherited', suffix: '—disrupts the gene', label: 'spontaneous_mutation_source' },
          { source: SOURCES.problem, num: 3, color: 'red', icon: XCircle, title: 'The Problem', badge: 'Autophagy Fails', text: 'Cells can\'t', highlight: 'recycle proteins', suffix: ', affecting brain cells', label: 'autophagy_disruption_source' },
          { source: SOURCES.result, num: 4, color: 'purple', icon: Brain, title: 'The Result', badge: 'Iron Buildup', text: 'Iron accumulates in', highlight: 'basal ganglia', suffix: ', causing symptoms', label: 'iron_accumulation_source' },
        ].map((step, idx) => {
          const Icon = step.icon;
          
          // Define color-specific classes to work with Tailwind JIT
          const colorClasses = {
            blue: {
              border: 'border-blue-300 hover:border-blue-500',
              bg: 'bg-gradient-to-br from-blue-50 to-white',
              badge: 'bg-blue-600',
              icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
              badgeBg: 'bg-blue-100',
              badgeText: 'text-blue-900',
              highlight: 'text-blue-800',
              link: 'text-blue-600'
            },
            orange: {
              border: 'border-orange-300 hover:border-orange-500',
              bg: 'bg-gradient-to-br from-orange-50 to-white',
              badge: 'bg-orange-600',
              icon: 'bg-gradient-to-br from-orange-500 to-orange-600',
              badgeBg: 'bg-orange-100',
              badgeText: 'text-orange-900',
              highlight: 'text-orange-800',
              link: 'text-orange-600'
            },
            red: {
              border: 'border-red-300 hover:border-red-500',
              bg: 'bg-gradient-to-br from-red-50 to-white',
              badge: 'bg-red-600',
              icon: 'bg-gradient-to-br from-red-500 to-red-600',
              badgeBg: 'bg-red-100',
              badgeText: 'text-red-900',
              highlight: 'text-red-800',
              link: 'text-red-600'
            },
            purple: {
              border: 'border-purple-300 hover:border-purple-500',
              bg: 'bg-gradient-to-br from-purple-50 to-white',
              badge: 'bg-purple-600',
              icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
              badgeBg: 'bg-purple-100',
              badgeText: 'text-purple-900',
              highlight: 'text-purple-800',
              link: 'text-purple-600'
            }
          };
          
          const colors = colorClasses[step.color as keyof typeof colorClasses];
          
          return (
            <div key={step.num}>
              <motion.a
                href={step.source.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl"
                onClick={() => trackEvent('science_source_click', {
                  event_category: 'content_engagement',
                  event_label: step.label,
                  link_location: 'science_flowchart_mobile'
                })}
              >
                <Card className={`border-2 ${colors.border} ${colors.bg} hover:shadow-lg transition-all duration-300`}>
                  <CardContent className="p-3 relative">
                    <div className={`absolute top-1.5 right-1.5 ${colors.badge} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`} aria-hidden="true">
                      {step.num}
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-11 h-11 ${colors.icon} rounded-lg flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5.5 w-5.5 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {step.title}
                        </h3>
                        <div className={`${colors.badgeBg} rounded px-2 py-0.5 mb-1 inline-block`}>
                          <p className={`text-sm font-semibold ${colors.badgeText}`}>
                            {step.badge}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug mb-1">
                          {step.text} <span className={`font-medium ${colors.highlight}`}>{step.highlight}</span>{step.suffix}
                        </p>
                        <div className={`flex items-center gap-1 ${colors.link} text-xs font-medium`}>
                          <ExternalLink className="h-3 w-3" />
                          <span>Learn more</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.a>
              {idx < 3 && (
                <div className="flex items-center justify-center py-1">
                  <ArrowDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}

        {/* Arrow before Hope */}
        <div className="flex items-center justify-center py-1">
          <ArrowDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        {/* Hope Card - Mobile */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="block group"
        >
          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white hover:border-green-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3 relative">
              <div className="absolute top-1.5 right-1.5 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                5
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Microscope className="h-5.5 w-5.5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    The Hope: Gene Therapy Research
                  </h3>
                  <div className="bg-green-100 rounded px-2 py-0.5 mb-1 inline-block">
                    <p className="text-sm font-semibold text-green-900">
                      Correcting the WDR45 mutation
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 leading-snug mb-1">
                    Gene therapy aims to <span className="font-medium text-green-800">restore WDR45 function</span>.{' '}
                    <a 
                      href="#research"
                      className="text-green-600 hover:text-green-800 underline font-semibold inline-flex items-center gap-0.5"
                      onClick={(e) => {
                        e.preventDefault();
                        trackEvent('internal_navigation', {
                          event_category: 'content_engagement',
                          event_label: 'science_to_research_section_mobile',
                          link_location: 'science_flowchart_mobile'
                        });
                        document.getElementById('research')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      View recent breakthroughs
                      <ArrowRight className="h-3 w-3" />
                    </a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}