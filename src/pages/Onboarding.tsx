import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Calendar, Stethoscope, Video, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const isRTL = i18n.language === 'ar';

  const slides = [
    {
      id: 1,
      icon: null,
      title: t('onboarding.slide1.title'),
      subtitle: t('onboarding.slide1.subtitle'),
      desc: t('onboarding.slide1.desc'),
      logo: true
    },
    {
      id: 2,
      icon: Calendar,
      gradient: 'from-emerald-500 to-teal-600',
      title: t('onboarding.slide2.title'),
      subtitle: t('onboarding.slide2.subtitle'),
      desc: t('onboarding.slide2.desc')
    },
    {
      id: 3,
      icon: Stethoscope,
      gradient: 'from-[#0d7a5b] to-emerald-600',
      title: t('onboarding.slide3.title'),
      subtitle: t('onboarding.slide3.subtitle'),
      desc: t('onboarding.slide3.desc')
    },
    {
      id: 4,
      icon: Video,
      gradient: 'from-blue-500 to-indigo-600',
      title: t('onboarding.slide4.title'),
      subtitle: t('onboarding.slide4.subtitle'),
      desc: t('onboarding.slide4.desc')
    },
    {
      id: 5,
      icon: ArrowRight,
      gradient: 'from-emerald-600 to-teal-700',
      title: t('onboarding.slide5.title'),
      subtitle: t('onboarding.slide5.subtitle'),
      desc: t('onboarding.slide5.desc')
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => onComplete();

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? (isRTL ? -1000 : 1000) : (isRTL ? 1000 : -1000),
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? (isRTL ? -1000 : 1000) : (isRTL ? 1000 : -1000),
      opacity: 0
    })
  };

  const IconComponent = slides[currentSlide].icon;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050b14] overflow-hidden flex flex-col items-center select-none">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10 translate-y-1/2 -translate-x-1/2"></div>

      <div className="flex-1 w-full max-w-xl mx-auto px-6 flex flex-col justify-center items-center relative py-20">
        <AnimatePresence mode="wait" initial={false} custom={currentSlide}>
          <motion.div
            key={currentSlide}
            custom={currentSlide}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="w-full flex flex-col items-center text-center space-y-8"
          >
            {/* Visual Header */}
            <div className="relative">
              {slides[currentSlide].logo ? (
                <div className="w-[132px] h-[132px] bg-white rounded-[2.5rem] p-4 shadow-2xl shadow-emerald-500/20 transform hover:scale-105 transition-transform duration-500 overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className={cn(
                  "w-[132px] h-[132px] rounded-[2.5rem] shadow-2xl flex items-center justify-center p-8 bg-gradient-to-br",
                  slides[currentSlide].gradient,
                  "shadow-emerald-500/20"
                )}>
                  {IconComponent && <IconComponent className={cn("w-full h-full text-white", isRTL && currentSlide === 4 && "rotate-180")} />}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-500/80">
                {slides[currentSlide].subtitle}
              </h2>
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                {slides[currentSlide].title}
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-sm mx-auto">
                {slides[currentSlide].desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="w-full max-w-xl mx-auto px-8 pb-12 flex flex-col gap-10 items-center">
        {/* Dot Indicators */}
        <div className="flex gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentSlide === i ? "w-8 bg-emerald-500 shadow-md shadow-emerald-500/40" : "w-2 bg-slate-800 hover:bg-slate-700"
              )}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="w-full flex gap-4">
          {currentSlide === slides.length - 1 ? (
            <Button
              onClick={onComplete}
              className="w-full h-16 rounded-2.5xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('getStarted')}
              {isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1 h-14 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
              >
                {t('skip')}
              </Button>
              <Button
                onClick={handleNext}
                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
              >
                {t('next')}
                {isRTL ? <ChevronLeft className="w-5 h-5 flex-shrink-0" /> : <ChevronRight className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
