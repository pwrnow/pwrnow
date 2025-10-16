'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 },
  },
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export default function HowItWorksSection() {
  const t = useTranslations('ForOrganizationsPage.Sections.HowItWorks');
  const stepsData = [
    {
      title: t('steps.1.title'),
      description: t.rich('steps.1.description', {
        Link: (chunks) => (
          <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@pwrnow.pl'}`} className='text-primary hover:underline font-medium'>
            {chunks}
          </a>
        ),
      }),
      step: 1,
      delay: 300,
      icon: '✉️',
    },
    {
      title: t('steps.2.title'),
      description: t('steps.2.description'),
      step: 2,
      delay: 600,
      icon: '🔑',
    },
    {
      title: t('steps.3.title'),
      description: t('steps.3.description'),
      step: 3,
      delay: 900,
      icon: '📅',
    },
    {
      title: t('steps.4.title'),
      description: t('steps.4.description'),
      step: 4,
      delay: 1200,
      icon: '🎯',
    },
  ];

  
  return (
    <motion.section
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      id='how-it-works'
      className='scroll-mt-24'
    >
      <motion.h2
        variants={scaleIn}
        className='text-3xl font-bold text-center mb-16 animate-fade-up animate-duration-1000'
      >
        {t('title')}
      </motion.h2>
      <div className='relative'>
        <div className='absolute left-1/2 -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary/50 via-primary to-transparent rounded-full animate-pulse animate-duration-[3000ms]'></div>
        {stepsData.map((item, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            custom={index}
            className={`relative flex items-start gap-8 mb-16 ${
              index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            <div
              className={`hidden md:flex items-center justify-center w-16 h-16 bg-background border-2 border-primary rounded-full z-10 text-xl font-bold shrink-0 animate-fade-${
                index % 2 === 0 ? 'right' : 'left'
              } animate-duration-1000 hover:scale-110 transition-transform duration-300`}
              style={{ animationDelay: `${item.delay}ms` }}
            >
              <span
                className='animate-fade-up animate-float'
                style={{ animationDelay: `${item.delay + 300}ms` }}
              >
                {item.step}
              </span>
            </div>
            <motion.div
              variants={{
                hidden: { opacity: 0, x: index % 2 === 0 ? -20 : 20 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 0.6,
                    delay: index * 0.2,
                  },
                },
              }}
              className={`w-full md:w-[calc(50%-2rem)] p-6 bg-card rounded-lg shadow-md transition-all duration-500 animate-fade-${
                index % 2 === 0 ? 'left' : 'right'
              } hover:shadow-xl hover:-translate-y-1 group`}
              style={{ animationDelay: `${item.delay}ms` }}
            >
              <div className='md:hidden flex items-center gap-4 mb-4'>
                <div className='flex items-center justify-center w-10 h-10 bg-background border-2 border-primary rounded-full z-10 font-bold shrink-0'>
                  {item.step}
                </div>
                <h3 className='text-xl font-semibold'>{item.title}</h3>
              </div>
              <div className='flex items-start gap-4'>
                <div
                  className='text-3xl hidden md:block animate-fade-up animate-duration-1000 group-hover:animate-wiggle'
                  style={{ animationDelay: `${item.delay + 400}ms` }}
                >
                  {item.icon}
                </div>
                <div className='flex-1'>
                  <h3 className='hidden md:block text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300'>
                    {item.title}
                  </h3>
                  <p className='text-muted-foreground group-hover:text-foreground transition-colors duration-300'>
                    {item.description}
                  </p>
                </div>
              </div>
              <div className='w-full h-1 mt-4 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left'></div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


