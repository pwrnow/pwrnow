'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AnimatedShowcase from '@/components/animated-showcase';
import { useTranslations } from 'next-intl';
import { CONTACT_CONFIG } from '@/lib/config';
import { motion } from 'framer-motion';

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const slideInLeft = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.8 },
  },
};

const slideInRight = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.8 },
  },
};

export default function HeroSection() {
  const t = useTranslations('ForOrganizationsPage.Sections.Hero');
  return (
    <motion.section
      initial='hidden'
      animate='visible'
      variants={staggerContainer}
      className='flex flex-col md:flex-row gap-12 items-center relative'
    >
      <motion.div variants={slideInLeft} className='md:w-1/2 space-y-8 z-10'>
        <h1 className='text-4xl md:text-5xl font-bold animate-fade-right animate-duration-1000 animate-delay-300'>
          {t('titlePart1')}{' '}
          <span className='text-primary'>{t('titleEmphasis')}</span>
        </h1>
        <p className='text-lg text-muted-foreground animate-fade-right animate-duration-1000 animate-delay-500'>
          {t('description')}
        </p>
        <div className='flex flex-col sm:flex-row gap-4 animate-fade-up animate-duration-1000 animate-delay-700'>
          <Link
            href={`mailto:${CONTACT_CONFIG.EMAIL}`}
            className='group relative overflow-hidden rounded-md'
          >
            <Button
              size='lg'
              className='w-full sm:w-auto group-hover:translate-y-0 transition-all duration-300 shadow-md'
            >
              {t('joinButton')}
            </Button>
            <span className='absolute inset-0 flex items-center justify-center bg-primary text-primary-foreground -translate-y-full group-hover:translate-y-0 transition-transform duration-300'>
              {t('joinButtonHover')}
            </span>
          </Link>
          <Link href='#dlaczego-pwrnow'>
            <Button variant='outline' size='lg' className='w-full sm:w-auto'>
              {t('moreButton')}
            </Button>
          </Link>
        </div>
      </motion.div>
      <motion.div
        variants={slideInRight}
        className='md:w-1/2 relative animate-fade-left animate-duration-1000 animate-delay-300'
      >
        <div className='absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-50 animate-pulse animate-duration-5000'></div>
        <div className='relative rounded-xl overflow-hidden shadow-xl'>
          <AnimatedShowcase />
        </div>
      </motion.div>
    </motion.section>
  );
}


