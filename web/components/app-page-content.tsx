'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useAnalytics } from '@/lib/useAnalytics';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import AppStoreDownload from './app-store-download';

export default function AppPageContent() {
  const t = useTranslations('AppPage');
  const locale = useLocale();
  const { safeCapture } = useAnalytics();

  // Mouse tracking for 3D parallax effect
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Transform mouse position to rotation values for 3D effect
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-15, 15]);
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [15, -15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = (e.clientX - centerX) / rect.width;
    const y = (e.clientY - centerY) / rect.height;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    // Track custom page view (PostHog auto-captures pageviews via defaults: '2025-05-24')
    safeCapture('app_page_viewed', {
      locale,
      page_type: 'app_announcement',
      page_path: '/aplikacja',
    });
  }, [safeCapture, locale]);

  return (
    <div className='relative min-h-screen w-full overflow-x-hidden bg-background'>
      {/* Subtle background accent - matching general app design */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl' />
        <div className='absolute bottom-0 left-0 w-[350px] h-[350px] bg-accent/5 rounded-full blur-3xl' />
      </div>

      {/* Main content container */}
      <div className='relative z-10 min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-0'>
        <div className='w-full max-w-[1800px] mx-auto'>
          <div className='flex flex-col lg:grid lg:grid-cols-[1fr_1.2fr] gap-6 md:gap-8 lg:gap-12 xl:gap-16 items-center'>

            {/* Left side - Text content */}
            <div className='flex flex-col justify-center space-y-4 sm:space-y-6 lg:space-y-8 xl:space-y-10 text-center lg:text-left lg:pl-8 xl:pl-12 w-full'>
              <div
                className='space-y-3 sm:space-y-4 lg:space-y-5 animate-slide-up opacity-0'
                style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
              >
                <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1]'>
                  <span className='gradient-text'>{t('headline')}</span>
                </h1>
                <p className='text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light max-w-2xl mx-auto lg:mx-0'>
                  {t('subheadline')}
                </p>
              </div>

              <div
                className='space-y-4 sm:space-y-5 lg:space-y-6 animate-slide-up opacity-0'
                style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
              >
                <div className='inline-block'>
                  <p className='text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground/90 font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/5 border border-primary/10'>
                    {t('bothAppsAvailable')}
                  </p>
                </div>

                <AppStoreDownload className='justify-center lg:justify-start' />
              </div>
            </div>

            {/* Right side - Phone mockups with 3D animations */}
            <motion.div
              ref={containerRef}
              className='relative flex items-center justify-center lg:justify-end w-full touch-none select-none'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                perspective: '1500px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div className='relative w-full max-w-[500px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]'>
                <div className='relative w-full' style={{ paddingBottom: '100%' }}>
                  {/* Android phone - left/back with stunning entrance and 3D effect */}
                  <motion.div
                    className='absolute left-0 top-0 w-[45%] z-10 touch-none select-none pointer-events-none'
                    initial={{
                      x: -200,
                      y: 100,
                      opacity: 0,
                      rotate: -25,
                      scale: 0.5
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                      rotate: 0,
                      scale: 1
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 0.6,
                      ease: [0.34, 1.56, 0.64, 1],
                      type: 'spring',
                      stiffness: 80
                    }}
                    style={{
                      rotateY,
                      rotateX,
                      transformStyle: 'preserve-3d',
                      z: -50,
                      WebkitTapHighlightColor: 'transparent',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                    whileHover={{
                      scale: 1.05,
                      z: 0,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.2
                      }}
                      className='select-none'
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                      }}
                    >
                      <Image
                        src='/android-app-mockup.png'
                        alt={t('androidScreenshot')}
                        width={400}
                        height={800}
                        className='w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] md:drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all duration-300 select-none pointer-events-none'
                        priority
                        draggable={false}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          WebkitTouchCallout: 'none',
                          userSelect: 'none',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* iPhone - right/front with stunning entrance and enhanced 3D effect */}
                  <motion.div
                    className='absolute right-0 top-0 w-[45%] z-20 touch-none select-none pointer-events-none'
                    initial={{
                      x: 200,
                      y: -100,
                      opacity: 0,
                      rotate: 25,
                      scale: 0.5
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                      rotate: 0,
                      scale: 1
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 0.8,
                      ease: [0.34, 1.56, 0.64, 1],
                      type: 'spring',
                      stiffness: 80
                    }}
                    style={{
                      rotateY: useTransform(rotateY, (value) => value * 1.3),
                      rotateX: useTransform(rotateX, (value) => value * 1.3),
                      transformStyle: 'preserve-3d',
                      z: 50,
                      WebkitTapHighlightColor: 'transparent',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                    }}
                    whileHover={{
                      scale: 1.08,
                      z: 100,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -20, 0],
                      }}
                      transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className='select-none'
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                      }}
                    >
                      <Image
                        src='/iphone-app-mockup.png'
                        alt={t('iosScreenshot')}
                        width={400}
                        height={800}
                        className='w-full h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.7)] md:drop-shadow-[0_35px_70px_rgba(0,0,0,0.7)] transition-all duration-300 select-none pointer-events-none'
                        priority
                        draggable={false}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          WebkitTouchCallout: 'none',
                          userSelect: 'none',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                        }}
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

