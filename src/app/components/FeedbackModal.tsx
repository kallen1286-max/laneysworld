import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { trackEvent } from '../utils/analytics';

const SERVER_URL = import.meta.env.VITE_API_URL ?? '';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** GA4: where the modal was triggered from (e.g. 'sticky_header' | 'footer') */
  openedFrom?: string;
}

export function FeedbackModal({ isOpen, onClose, openedFrom = 'unknown' }: FeedbackModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Track open + manage body scroll
  useEffect(() => {
    if (isOpen) {
      trackEvent('feedback_modal_open', {
        event_category: 'engagement',
        event_label: 'feedback_form',
        form_location: openedFrom,
      });
      document.body.style.overflow = 'hidden';
      // Move focus into modal
      setTimeout(() => firstInputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    // Reset form after close animation settles
    setTimeout(() => {
      setName('');
      setEmail('');
      setFeedback('');
      setIsSuccess(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!feedback.trim()) {
      toast.error('Please enter your message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${SERVER_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          feedback: feedback.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed. Please try again.');
      }

      // Custom submit event
      trackEvent('feedback_submit', {
        event_category: 'engagement',
        event_label: 'feedback_form',
        form_location: openedFrom,
      });
      // GA4 standard conversion event — surfaces in default reports
      trackEvent('generate_lead', {
        event_category: 'engagement',
        form_name: 'contact_form',
        form_location: openedFrom,
      });

      setIsSuccess(true);
      // Auto-close after showing success
      setTimeout(() => handleClose(), 2800);
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      toast.error(err.message || 'Something went wrong. Please try again.');
      trackEvent('feedback_submit_error', {
        event_category: 'engagement',
        event_label: 'feedback_form',
        form_location: openedFrom,
        error_message: err?.message ?? 'unknown_error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.60)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-[#0F172A] dark:to-[#E6A100] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-white flex-shrink-0" aria-hidden="true" />
            <h2
              id="feedback-modal-title"
              className="text-white text-lg font-semibold leading-tight"
            >
              Send Us a Message
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/20 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close message form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {isSuccess ? (
            /* ── Success State ── */
            <div className="text-center py-8" role="status" aria-live="polite">
              <CheckCircle
                className="h-14 w-14 text-green-500 mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-[#F8FAFC] mb-2">
                Thank you!
              </h3>
              <p className="text-gray-500 dark:text-[#94A3B8] text-sm leading-relaxed">
                Your message is on its way. We'll be in touch soon.
              </p>
            </div>
          ) : (
            /* ── Form State ── */
            <form onSubmit={handleSubmit} noValidate>
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-5 leading-relaxed">
                Questions, thoughts, or just want to say hi? We'd love to hear from you.
              </p>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="feedback-name"
                    className="block text-sm font-medium text-gray-700 dark:text-[#CBD5E1] mb-1.5"
                  >
                    Name{' '}
                    <span className="text-gray-400 dark:text-[#64748B] font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="feedback-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#1E293B] rounded-lg text-sm text-gray-900 dark:text-[#F8FAFC] placeholder-gray-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-[#0F172A]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="feedback-email"
                    className="block text-sm font-medium text-gray-700 dark:text-[#CBD5E1] mb-1.5"
                  >
                    Email{' '}
                    <span className="text-red-500 text-xs" aria-label="required">*</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-required="true"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#1E293B] rounded-lg text-sm text-gray-900 dark:text-[#F8FAFC] placeholder-gray-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-[#0F172A]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="feedback-message"
                    className="block text-sm font-medium text-gray-700 dark:text-[#CBD5E1] mb-1.5"
                  >
                    Message{' '}
                    <span className="text-red-500 text-xs" aria-label="required">*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Your message…"
                    rows={5}
                    aria-required="true"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#1E293B] rounded-lg text-sm text-gray-900 dark:text-[#F8FAFC] placeholder-gray-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-[#0F172A]"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[48px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Send Message</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 dark:text-[#64748B] text-center mt-4 leading-relaxed">
                Sent directly to the team. We respect your privacy.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
