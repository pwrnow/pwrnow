'use client';

import { motion } from 'framer-motion';
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

const questionsData = [
  {
    question: 'Kto może dodawać wydarzenia na platformę?',
    answer:
      'Aktualnie przyjmujemy organizacje studenckie, koła naukowe, samorządy wydziałowe oraz inne grupy związane z Politechniką Wrocławską. Jeśli reprezentujesz taką organizację, skontaktuj się z nami!',
  },
  {
    question: 'Czy korzystanie z platformy jest płatne?',
    answer:
      'Nie, korzystanie z PWr Now jest całkowicie bezpłatne zarówno dla organizacji, jak i dla studentów.',
  },
  {
    question: 'Jak szybko moje wydarzenie pojawi się na platformie?',
    answer:
      'Staramy się, aby Twoje wydarzenia pojawiały się na platformie jak najszybciej po ich dodaniu.',
  },
  {
    question: 'Czy wydarzenia podlegają weryfikacji?',
    answer:
      'Tak, wydarzenia przechodzą weryfikację przed pojawieniem się na platformie, aby zapewnić odpowiedni standard i jakość treści dla naszych użytkowników.',
  },
  {
    question: 'Czy mogę edytować lub usunąć opublikowane wydarzenie?',
    answer:
      'Tak, w dowolnym momencie możesz edytować szczegóły wydarzenia lub usunąć je z platformy za pomocą panelu organizacji.',
  },
  {
    question: 'Jakie informacje mogę zamieścić o wydarzeniu?',
    answer:
      'Możesz dodać tytuł, opis, datę i godzinę, miejsce, kategorię wydarzenia, zdjęcie, link do rejestracji oraz inne istotne informacje.',
  },
];

export default function FaqSection() {
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
        Najczęściej zadawane pytania
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
