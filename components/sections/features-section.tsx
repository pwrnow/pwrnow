'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

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

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const features = [
  {
    title: 'Większa widoczność',
    description:
      'Docieraj do szerszego grona studentów, którzy aktywnie poszukują wydarzeń na uczelni.',
    icon: '🚀',
    delay: 300,
  },
  {
    title: 'Prosta publikacja',
    description:
      'Dodawaj swoje wydarzenia w prosty i intuicyjny sposób, bez zbędnych formalności.',
    icon: '✨',
    delay: 500,
  },
  {
    title: 'Większa frekwencja',
    description:
      'Zwiększ liczbę uczestników dzięki lepszej promocji i docieraniu do zainteresowanych osób.',
    icon: '👥',
    delay: 700,
  },
];

export default function FeaturesSection() {
  return (
    <motion.section
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.5 }}
      variants={fadeInUp}
      id='dlaczego-pwrnow'
      className='scroll-mt-24'
    >
      <motion.h2
        variants={scaleIn}
        className='text-3xl font-bold text-center mb-12 animate-fade-up animate-duration-1000'
      >
        Dlaczego warto dołączyć do PWr Now?
      </motion.h2>
      <motion.div
        variants={staggerContainer}
        className='grid grid-cols-1 md:grid-cols-3 gap-8'
      >
        {features.map((item, index) => (
          <motion.div key={index} variants={fadeInUp}>
            <Card
              className='p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-up'
              style={{ animationDelay: `${item.delay}ms` }}
            >
              <div className='text-4xl mb-4'>{item.icon}</div>
              <h3 className='text-xl font-semibold mb-2'>{item.title}</h3>
              <p className='text-muted-foreground'>{item.description}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
