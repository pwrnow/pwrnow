'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
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

const buttonHover = {
  initial: { scale: 1, boxShadow: '0px 0px 0px rgba(99, 102, 241, 0)' },
  hover: {
    scale: 1.05,
    boxShadow: '0px 10px 20px rgba(99, 102, 241, 0.3)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  tap: { scale: 0.98 },
};

export default function ContactSection() {
  return (
    <motion.section
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.5 }}
      variants={fadeInUp}
      id='kontakt'
      className='scroll-mt-24 text-center'
    >
      <motion.h2
        variants={scaleIn}
        className='text-3xl font-bold mb-8 animate-fade-up animate-duration-1000'
      >
        Gotowi na współpracę?
      </motion.h2>
      <motion.p
        variants={fadeInUp}
        className='text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up animate-duration-1000 animate-delay-300'
      >
        Jeśli chcesz, by wydarzenia Twojej organizacji dotarły do większej
        liczby studentów, napisz do nas już teraz!
      </motion.p>
      <div className='animate-fade-up animate-duration-1000 animate-delay-500'>
        <Link href='mailto:pwrnow.kontakt@gmail.com'>
          <motion.div
            initial='initial'
            whileHover='hover'
            whileTap='tap'
            variants={buttonHover}
            className='inline-block'
          >
            <Button
              size='lg'
              className='text-lg px-8 relative overflow-hidden group'
            >
              <span className='relative z-10'>pwrnow.kontakt@gmail.com</span>
              <span className='absolute inset-0 bg-primary/20 -translate-y-full group-hover:translate-y-0 transition-transform duration-300'></span>
            </Button>
          </motion.div>
        </Link>
      </div>
    </motion.section>
  );
}
