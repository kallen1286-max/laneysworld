import { ArrowLeft, Heart, Shield, Eye, Trash2, Mail, ExternalLink, Lock, FileText, Camera } from 'lucide-react';
import laneysWorldLogo from 'figma:asset/098025f9056d201a154be344dcf4936569c25264.png';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const EFFECTIVE_DATE = 'March 16, 2026';
const CONTACT_EMAIL = 'updates@laneysworld.com';
const SITE_NAME = "Delaney's World";
const ORG_NAME = "Don't Forget Me Foundation";
const TAX_ID = '84-3358278';

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ id, icon, title, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600">
          {icon}
        </div>
        <h2 id={`${id}-heading`} className="text-xl sm:text-2xl text-gray-900">
          {title}
        </h2>
      </div>
      <div className="text-sm sm:text-base text-gray-700 leading-relaxed space-y-3 pl-12">
        {children}
      </div>
    </section>
  );
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Top Nav */}
      <nav aria-label="Privacy policy navigation" className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            aria-label="Go back to Delaney's World home page"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </button>
          <div className="h-4 w-px bg-gray-300 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-gray-500 truncate">Privacy Policy & IP Notice</span>
        </div>
      </nav>

      <main id="privacy-main" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <header className="text-center mb-12">
          <button
            onClick={onBack}
            className="inline-block mb-6 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-2xl"
            aria-label="Go back to Delaney's World home page"
          >
            <img
              src={laneysWorldLogo}
              alt="Delaney's World"
              className="w-24 h-auto rounded-2xl mx-auto"
              width={96}
              height={96}
              loading="eager"
            />
          </button>
          <h1 className="text-3xl sm:text-4xl text-gray-900 mb-3">
            Privacy Policy & Intellectual Property Notice
          </h1>
          <p className="text-gray-500 text-sm">
            {SITE_NAME} · {ORG_NAME} · Effective {EFFECTIVE_DATE}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-full">
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>We never sell, rent, or share your personal information.</span>
          </div>
        </header>

        {/* Quick-jump nav */}
        <nav aria-label="Jump to section" className="bg-white border border-gray-200 rounded-xl p-5 mb-10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contents</p>
          <ol className="grid sm:grid-cols-2 gap-1.5 text-sm text-blue-600">
            {[
              ['#info-collected', '1. Information We Collect'],
              ['#how-we-use', '2. How We Use It'],
              ['#storage', '3. Data Storage & Security'],
              ['#third-party', '4. Third-Party Services'],
              ['#cookies', '5. Cookies & Tracking'],
              ['#your-rights', '6. Your Privacy Rights'],
              ['#children', '7. Children\'s Privacy'],
              ['#retention', '8. Data Retention'],
              ['#ip-notice', '9. Intellectual Property'],
              ['#changes', '10. Changes to This Policy'],
              ['#contact', '11. Contact Us'],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="hover:text-blue-800 hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Introduction */}
        <div className="bg-blue-50 rounded-xl p-5 mb-10 text-sm sm:text-base text-gray-700 leading-relaxed">
          <p>
            {SITE_NAME} is operated by the <strong>{ORG_NAME}</strong>, a 501(c)(3) nonprofit organization
            (Tax ID {TAX_ID}) based in Fairfield, Connecticut. This page explains what personal information
            we collect when you visit <strong>laneysworld.com</strong>, how we use it, your rights under
            applicable privacy laws (Connecticut CTDPA, California CCPA, and EU GDPR), and the intellectual
            property rights covering all content published on this site.
          </p>
        </div>

        {/* ── Section 1 ── */}
        <Section id="info-collected" icon={<Eye className="h-5 w-5" />} title="1. Information We Collect">
          <p><strong>A. Information you give us voluntarily (Feedback Form)</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Name</strong> — optional, only if you choose to provide it</li>
            <li><strong>Email address</strong> — required to reply to your message</li>
            <li><strong>Message content</strong> — your feedback, question, or note</li>
          </ul>
          <p className="mt-3"><strong>B. Information collected automatically (Analytics)</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pages visited and scroll depth (via Google Analytics 4)</li>
            <li>Referring website, browser type, and operating system</li>
            <li>General geographic region (country/city level — IP addresses are anonymized by GA4 before storage)</li>
            <li>Session duration and user interactions (button clicks, video plays)</li>
          </ul>
          <p className="mt-3">We do <strong>not</strong> collect payment information, government IDs, health
          records, or any other sensitive personal data. Donations are processed entirely by GoFundMe's
          secure platform.</p>
        </Section>

        {/* ── Section 2 ── */}
        <Section id="how-we-use" icon={<FileText className="h-5 w-5" />} title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Feedback form submissions:</strong> To read and respond to your message. We do not add you to any mailing list without your explicit consent.</li>
            <li><strong>Analytics data:</strong> To understand which sections of the site resonate most, improve content, and measure the impact of our awareness efforts.</li>
            <li><strong>Legal compliance:</strong> We may retain or disclose information as required by law.</li>
          </ul>
          <p className="mt-3 font-semibold text-green-700">
            ✓ We do not sell, rent, trade, or share your personal information with advertisers or data brokers.
          </p>
        </Section>

        {/* ── Section 3 ── */}
        <Section id="storage" icon={<Lock className="h-5 w-5" />} title="3. Data Storage & Security">
          <p>
            Feedback form submissions are delivered directly as email notifications via{' '}
            <strong>Resend</strong>, a transactional email service, and are not persisted to a database.
            Email content includes your name, email address, and message. Resend retains delivery logs for
            up to 30 days. All transmission is encrypted in transit (TLS 1.2+).
          </p>
          <p>
            While we take reasonable precautions to protect your data, no internet transmission is 100%
            secure. If you have a security concern, please contact us at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {CONTACT_EMAIL}
            </a>.
          </p>
        </Section>

        {/* ── Section 4 ── */}
        <Section id="third-party" icon={<ExternalLink className="h-5 w-5" />} title="4. Third-Party Services">
          <p>This site integrates the following third-party services. Each has its own privacy policy:</p>
          <div className="space-y-3 mt-2">
            {[
              {
                name: 'Google Analytics 4',
                use: 'Website analytics. Ad personalization and Google Signals are disabled. IP addresses are anonymized before storage.',
                link: 'https://policies.google.com/privacy',
                optout: 'https://tools.google.com/dlpage/gaoptout',
              },
              {
                name: 'YouTube (Privacy-Enhanced Mode)',
                use: 'Embedded video. Cookies are set only when you click the play button. We use youtube-nocookie.com to minimize data sharing.',
                link: 'https://policies.google.com/privacy',
              },
              {
                name: 'GoFundMe',
                use: 'Donation processing. Clicking "Donate Now" takes you to GoFundMe\'s platform, governed entirely by their privacy policy.',
                link: 'https://www.gofundme.com/en-us/privacy',
              },
              {
                name: 'Resend',
                use: 'Transactional email delivery for feedback form notifications.',
                link: 'https://resend.com/privacy',
              },
            ].map(svc => (
              <div key={svc.name} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="font-semibold text-gray-900">{svc.name}</p>
                <p className="text-sm text-gray-600 mt-0.5">{svc.use}</p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-sm">
                  <a
                    href={svc.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Privacy Policy <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">(opens in new window)</span>
                  </a>
                  {svc.optout && (
                    <a
                      href={svc.optout}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Opt-Out Tool <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only">(opens in new window)</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Section 5 ── */}
        <Section id="cookies" icon={<Shield className="h-5 w-5" />} title="5. Cookies & Tracking">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-2 rounded-tl-lg font-semibold text-gray-900">Cookie</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900">Purpose</th>
                  <th className="text-left px-3 py-2 rounded-tr-lg font-semibold text-gray-900">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { name: '_ga', purpose: 'Google Analytics — distinguishes unique users', duration: '2 years' },
                  { name: '_ga_XXXXXXXX', purpose: 'Google Analytics — session state for GA4', duration: '2 years' },
                  { name: 'YouTube cookies', purpose: 'Set only when you click the video play button', duration: 'Session / up to 180 days' },
                ].map(row => (
                  <tr key={row.name} className="bg-white">
                    <td className="px-3 py-2 font-mono text-xs text-gray-700">{row.name}</td>
                    <td className="px-3 py-2 text-gray-700">{row.purpose}</td>
                    <td className="px-3 py-2 text-gray-500">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            We do <strong>not</strong> use advertising cookies, cross-site tracking pixels, or retargeting
            tags. You can opt out of Google Analytics at any time using Google's{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Browser Opt-out Add-on<span className="sr-only"> (opens in new window)</span>
            </a>.
          </p>
        </Section>

        {/* ── Section 6 ── */}
        <Section id="your-rights" icon={<Shield className="h-5 w-5" />} title="6. Your Privacy Rights">
          <p>Depending on where you live, you may have the following rights:</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {[
              { law: 'Connecticut CTDPA', rights: ['Right to access your data', 'Right to correct inaccurate data', 'Right to delete your data', 'Right to data portability', 'Right to opt out of targeted advertising (we don\'t do this)', 'Right to appeal a decision about your data'] },
              { law: 'California CCPA / CPRA', rights: ['Right to know what data is collected', 'Right to delete personal information', 'Right to correct personal information', 'Right to opt out of sale (we don\'t sell data)', 'Right to non-discrimination for exercising rights'] },
              { law: 'European Union GDPR', rights: ['Right of access (Art. 15)', 'Right to erasure / "right to be forgotten" (Art. 17)', 'Right to restrict processing (Art. 18)', 'Right to data portability (Art. 20)', 'Right to object to processing (Art. 21)'] },
            ].map(block => (
              <div key={block.law} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="font-semibold text-blue-900 text-sm mb-2">{block.law}</p>
                <ul className="space-y-1">
                  {block.rights.map(r => (
                    <li key={r} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4">
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline font-medium">
              {CONTACT_EMAIL}
            </a>{' '}
            with the subject line <em>"Privacy Request"</em>. We will respond within 30 days (45 days for
            GDPR-covered requests). We will not discriminate against you for exercising your rights.
          </p>
        </Section>

        {/* ── Section 7 ── */}
        <Section id="children" icon={<Heart className="h-5 w-5" />} title="7. Children's Privacy">
          <p>
            This website is intended for adults who want to learn about BPAN and support research
            funding. We do not knowingly collect personal information from children under 13 (COPPA)
            or children under 16 (GDPR). Although Delaney's story is the heart of this site, this
            website itself is an adult-facing advocacy and fundraising platform.
          </p>
          <p>
            If you believe we have inadvertently collected information from a child, please contact us
            immediately at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
              {CONTACT_EMAIL}
            </a>{' '}
            and we will delete it promptly.
          </p>
        </Section>

        {/* ── Section 8 ── */}
        <Section id="retention" icon={<Trash2 className="h-5 w-5" />} title="8. Data Retention">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Feedback form submissions:</strong> Retained for up to <strong>12 months</strong> from
              the date of submission, then deleted, unless an ongoing correspondence requires retention.
            </li>
            <li>
              <strong>Resend email delivery logs:</strong> Retained by Resend for up to <strong>30 days</strong>.
            </li>
            <li>
              <strong>Google Analytics data:</strong> User and event data is retained for{' '}
              <strong>14 months</strong> per GA4 default settings, then automatically deleted by Google.
            </li>
          </ul>
          <p className="mt-3">
            You may request early deletion of your feedback submission at any time by emailing{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        {/* ── Section 9 ── */}
        <Section id="ip-notice" icon={<Camera className="h-5 w-5" />} title="9. Intellectual Property Notice">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="font-semibold text-amber-900 mb-1">Copyright Notice</p>
            <p className="text-amber-800 text-sm">
              © 2024–2026 {ORG_NAME} and Delaney's Family. All rights reserved.
            </p>
          </div>

          <p><strong>Photographs of Delaney</strong></p>
          <p>
            All photographs of Delaney and her family published on this website are private family
            photographs. These images are protected by copyright and belong exclusively to Delaney's
            family. <strong>Reproduction, redistribution, commercial use, or publication of any image
            without the express written permission of Delaney's family is strictly prohibited.</strong>{' '}
            Members of the press or media seeking to use these images must contact{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.
          </p>

          <p className="mt-3"><strong>"Delaney's World" Poem</strong></p>
          <p>
            The poem <em>"Delaney's World"</em> displayed on this site was written by Colin, Delaney's
            grandfather, and is reproduced with his permission. The poem is protected by copyright and
            may not be reproduced, distributed, or adapted without his express written consent.
          </p>

          <p className="mt-3"><strong>Site Design, Code &amp; Logo</strong></p>
          <p>
            The Delaney's World logo, site design, and original written content are © 2024–2026{' '}
            {ORG_NAME}. The site is built in partnership with Don't Forget Morgan.
          </p>

          <p className="mt-3"><strong>Medical &amp; Scientific Information</strong></p>
          <p>
            Medical and scientific information about BPAN is sourced from publicly available resources
            including the NIH Genetic and Rare Diseases Information Center, MedlinePlus (U.S. National
            Library of Medicine), and NCBI GeneReviews. This information is reproduced for educational and
            awareness purposes under fair use. All cited sources retain their own copyrights.
          </p>

          <p className="mt-3"><strong>Background Music</strong></p>
          <p>
            "Acoustic Guitar 1" by{' '}
            <a
              href="http://audionautix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Audionautix<span className="sr-only"> (opens in new window)</span>
            </a>{' '}
            is licensed under a{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Creative Commons Attribution 4.0 International License (CC BY 4.0)
              <span className="sr-only"> (opens in new window)</span>
            </a>.
          </p>
        </Section>

        {/* ── Section 10 ── */}
        <Section id="changes" icon={<FileText className="h-5 w-5" />} title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time as our practices change or applicable law
            requires. The "Effective Date" at the top of this page will always reflect the most recent
            revision. For material changes, we will update the date prominently. Continued use of the site
            after any change constitutes acceptance of the updated policy.
          </p>
        </Section>

        {/* ── Section 11 ── */}
        <Section id="contact" icon={<Mail className="h-5 w-5" />} title="11. Contact Us">
          <p>For any privacy request, data deletion, IP inquiry, or question about this policy:</p>
          <div className="bg-blue-50 rounded-xl p-4 mt-2 inline-block">
            <p className="font-semibold text-gray-900">{SITE_NAME} / {ORG_NAME}</p>
            <p className="text-gray-600">Fairfield, Connecticut, USA</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline mt-1 inline-block"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <p className="mt-4 text-gray-500 text-xs">
            We will respond to all privacy requests within 30 days. For GDPR-covered requests we will
            respond within 45 days and may ask you to verify your identity before acting on the request.
          </p>
        </Section>

        {/* Back to home */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            Back to Delaney's World
          </button>
          <p className="text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} {ORG_NAME} · Tax ID {TAX_ID} · All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
