'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, CheckSquare, Upload, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Role } from '@/config/roles';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  role: Role;
  userName?: string;
}

const ROLE_SPECIFIC_TIPS: Record<Role, string[]> = {
  owner: [
    'Monitor all team activities from your unified dashboard',
    'Use voice commands to quickly assign tasks across departments',
    'Review handoffs between sales, production, and finance teams',
  ],
  sales: [
    'Record customer conversations with voice transcription',
    'Track customer orders and invoices in real-time',
    'Hand off production requests seamlessly',
  ],
  production: [
    'Manage supplier communications and inventory',
    'Receive production handoffs from sales team',
    'Update order status with voice notes',
  ],
  finance: [
    'Track invoices and payments in one place',
    'Generate financial reports automatically',
    'Monitor cash flow with live dashboards',
  ],
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Voice-First Workflows',
    description: 'Speak naturally to create tasks, notes, and updates. We use OpenAI Whisper for accurate transcription.',
    icon: <Mic className="w-12 h-12 text-brand-red" />,
    tips: [
      'Press the microphone button or use ⌘/ (Ctrl+/) shortcut',
      'Speak clearly: "Create task: Follow up with supplier by Friday"',
      'Voice works everywhere - tasks, notes, and file uploads',
    ],
  },
  {
    title: 'Smart Task Management',
    description: 'Organize work across your team with role-specific dashboards and automatic task routing.',
    icon: <CheckSquare className="w-12 h-12 text-brand-blue" />,
    tips: [
      'Tasks are automatically assigned based on category',
      'Use the calendar view to plan your week',
      'Set priorities: HIGH, MEDIUM, LOW',
    ],
  },
  {
    title: 'File & Document Hub',
    description: 'Upload invoices, photos, and documents. Everything stays organized and searchable.',
    icon: <Upload className="w-12 h-12 text-brand-yellow" />,
    tips: [
      'Drag & drop files anywhere on the dashboard',
      'Supports PDFs, images, documents, spreadsheets',
      'Files are automatically linked to related tasks',
    ],
  },
];

/**
 * Welcome modal with interactive onboarding tour
 *
 * Shows new users key features with role-specific tips
 */
export function WelcomeModal({ isOpen, onClose, onComplete, role, userName }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleComplete = () => {
    if (dontShowAgain) {
      // Store preference in localStorage
      localStorage.setItem('decisionos_onboarding_completed', 'true');
    }
    onComplete();
    onClose();
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const roleTips = ROLE_SPECIFIC_TIPS[role] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative
              w-full max-w-2xl
              max-h-[90vh] sm:max-h-[85vh]
              bg-white dark:bg-zinc-900
              rounded-2xl
              shadow-2xl
              border border-zinc-200 dark:border-zinc-800
              overflow-hidden
              flex flex-col
            "
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-brand-red to-red-700 p-6 sm:p-8 text-white shrink-0">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="font-logo font-black text-2xl text-brand-red">D</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome{userName ? `, ${userName}` : ''}! <Sparkles className="w-5 h-5 inline-block" />
                  </h2>
                  <p className="text-red-100 text-sm">Let's get you started with DecisionOS</p>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="flex gap-2 mt-6">
                {ONBOARDING_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`
                      h-2 rounded-full transition-all
                      ${index === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}
                    `}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                      {step.icon}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-3">
                    {step.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-center mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* General Tips */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-5 mb-4">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">
                      Quick Tips
                    </h4>
                    <ul className="space-y-2">
                      {step.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <span className="text-brand-red mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Role-Specific Tips */}
                  {currentStep === 0 && roleTips.length > 0 && (
                    <div className="bg-brand-red/10 dark:bg-brand-red/20 rounded-lg p-5 border border-brand-red/20">
                      <h4 className="text-sm font-bold text-brand-red uppercase tracking-wider mb-3">
                        For {role.charAt(0).toUpperCase() + role.slice(1)} Role
                      </h4>
                      <ul className="space-y-2">
                        {roleTips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                            <span className="text-brand-red mt-0.5">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                    Don't show this again
                  </span>
                </label>

                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="
                        px-4 py-2
                        text-sm font-bold uppercase tracking-wider
                        text-zinc-600 dark:text-zinc-400
                        hover:text-zinc-900 dark:hover:text-zinc-100
                        transition-colors
                        flex items-center gap-2
                      "
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    className="
                      px-6 py-2
                      bg-brand-red
                      text-white font-bold
                      uppercase tracking-wider text-sm
                      rounded-md
                      hover:shadow-[var(--shadow-brutal-sm)]
                      transition-all
                      border border-zinc-950 dark:border-zinc-800
                      flex items-center gap-2
                    "
                  >
                    {currentStep < ONBOARDING_STEPS.length - 1 ? (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
