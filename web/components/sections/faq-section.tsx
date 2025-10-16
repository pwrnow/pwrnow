'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

export default function FaqSection() {
  const t = useTranslations('ForOrganizationsPage.Sections.Faq');
  const questionsData = [1,2,3,4,5,6].map((i) => ({
    question: t(`questions.${i}.q`),
    answer: t(`questions.${i}.a`),
  }));

  
  return (
    <motion.section
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      id='faq'
      className='scroll-mt-24'
    >
      <motion.h2
        variants={scaleIn}
        className='text-3xl font-bold text-center mb-12 animate-fade-up animate-duration-1000'
      >
        {t('title')}
      </motion.h2>
      <Accordion
        type='single'
        collapsible
        className='w-full max-w-3xl mx-auto animate-fade-up animate-duration-1000 animate-delay-300'
      >
        {questionsData.map((item, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            custom={index}
            transition={{ delay: index * 0.1 }}
          >
            <AccordionItem value={`item-${index}`} className='border-b'>
              <AccordionTrigger className='text-left font-medium py-4'>
                {item.question}
              </AccordionTrigger>
              <AccordionContent className='text-muted-foreground pb-4'>
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </motion.section>
  );
}


