'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const faqs = [
  {
    question: 'Jak mogę dodać wydarzenie organizacji na PWr Now?',
    answer:
      'Skontaktuj się z nami przez e-mail pwrnow.kontakt@gmail.com. Prześlij nam szczegóły wydarzenia: nazwę, datę, miejsce, opis i kategorię. Zweryfikujemy informacje i dodamy wydarzenie do platformy.',
  },
  {
    question: 'Czy korzystanie z PWr Now jest bezpłatne?',
    answer:
      'Tak! PWr Now jest całkowicie bezpłatną platformą dla wszystkich organizacji studenckich, kół naukowych i jednostek Politechniki Wrocławskiej.',
  },
  {
    question: 'Jakie rodzaje wydarzeń mogę promować?',
    answer:
      'Możesz promować wszystkie wydarzenia związane z życiem akademickim: konferencje, warsztaty, spotkania kół naukowych, konkursy, wydarzenia kulturalne, sportowe i integracyjne.',
  },
  {
    question: 'Jak długo trwa proces weryfikacji wydarzenia?',
    answer:
      'Proces weryfikacji zwykle trwa 1-2 dni robocze. Staramy się jak najszybciej przetwarzać wszystkie zgłoszenia, aby Twoje wydarzenie pojawiło się na platformie w odpowiednim czasie.',
  },
  {
    question: 'Czy mogę edytować informacje o wydarzeniu po publikacji?',
    answer:
      'Tak, możesz wprowadzać zmiany w informacjach o wydarzeniu. Skontaktuj się z nami z aktualizacjami, a my niezwłocznie zaktualizujemy dane na platformie.',
  },
  {
    question: 'Jak mogę dotrzeć do większej liczby studentów?',
    answer:
      'PWr Now automatycznie promuje wszystkie zweryfikowane wydarzenia. Dodatkowo, upewnij się, że Twój opis jest szczegółowy i zawiera wszystkie istotne informacje, które mogą zainteresować studentów.',
  },
];

function FaqItem({ faq, index }: { faq: (typeof faqs)[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card
      className='group transition-all duration-300 hover:shadow-md animate-fade-up'
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className='p-0'>
        <button
          className='w-full p-6 text-left transition-colors duration-200 hover:bg-muted/50'
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-foreground pr-4'>
              {faq.question}
            </h3>
            <div className='flex-shrink-0'>
              {isOpen ? (
                <ChevronUp className='h-5 w-5 text-muted-foreground transition-transform duration-200' />
              ) : (
                <ChevronDown className='h-5 w-5 text-muted-foreground transition-transform duration-200' />
              )}
            </div>
          </div>
        </button>
        {isOpen && (
          <div className='px-6 pb-6 animate-fade-up animate-duration-300'>
            <p className='text-muted-foreground leading-relaxed'>
              {faq.answer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FaqSection() {
  return (
    <section id='faq' className='py-24'>
      <div className='text-center mb-16'>
        <h2 className='text-3xl md:text-4xl font-bold mb-4 animate-fade-up'>
          Najczęściej zadawane <span className='gradient-text'>pytania</span>
        </h2>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up animate-delay-200'>
          Masz pytania? Sprawdź odpowiedzi na najczęściej zadawane pytania lub
          skontaktuj się z nami bezpośrednio.
        </p>
      </div>

      <div className='max-w-3xl mx-auto space-y-4'>
        {faqs.map((faq, index) => (
          <FaqItem key={index} faq={faq} index={index} />
        ))}
      </div>
    </section>
  );
}
