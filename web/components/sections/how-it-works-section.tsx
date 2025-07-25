'use client';

import { Search, Calendar, Users, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Odkryj wydarzenia',
    description:
      'Przeglądaj aktualne wydarzenia na PWr lub użyj filtru aby znaleźć to, co Cię interesuje.',
    color: 'from-accent to-primary',
  },
  {
    icon: Calendar,
    number: '02',
    title: 'Sprawdź szczegóły',
    description:
      'Dowiedz się więcej o wydarzeniu - data, miejsce, organizator i szczegółowy opis.',
    color: 'from-primary to-secondary',
  },
  {
    icon: Users,
    number: '03',
    title: 'Dołącz do społeczności',
    description:
      'Weź udział w wydarzeniu i nawiąż nowe znajomości w społeczności PWr.',
    color: 'from-secondary to-accent',
  },
  {
    icon: Heart,
    number: '04',
    title: 'Rozwijaj się',
    description:
      'Korzystaj z wiedzy i doświadczeń zdobytych podczas wydarzeń akademickich.',
    color: 'from-accent to-secondary',
  },
];

export default function HowItWorksSection() {
  return (
    <section id='jak-to-dziala' className='py-24 bg-muted/30'>
      <div className='text-center mb-16'>
        <h2 className='text-3xl md:text-4xl font-bold mb-4 animate-fade-up'>
          Jak działa <span className='gradient-text'>PWr Now</span>?
        </h2>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up animate-delay-200'>
          Proste kroki do odkrycia najlepszych wydarzeń na Politechnice
          Wrocławskiej
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-16'>
        {steps.map((step, index) => (
          <Card
            key={index}
            className='group relative overflow-hidden hover:shadow-xl transition-all duration-500 border-border/50 animate-fade-up'
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
            ></div>

            <CardContent className='p-6 relative'>
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <step.icon className='h-8 w-8 text-white' />
                  </div>
                </div>

                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <span
                      className={`text-2xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                    >
                      {step.number}
                    </span>
                    <h3 className='text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300'>
                      {step.title}
                    </h3>
                  </div>
                  <p className='text-muted-foreground leading-relaxed'>
                    {step.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <div className='text-center'>
        <div className='bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 max-w-2xl mx-auto animate-fade-up animate-delay-600'>
          <h3 className='text-2xl font-bold mb-4'>
            Gotowy na rozpoczęcie przygody?
          </h3>
          <p className='text-muted-foreground mb-6 text-lg'>
            Dołącz do tysięcy studentów PWr i nie przegap żadnego ważnego
            wydarzenia!
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' className='group' asChild>
              <Link href='#dla-organizacji'>
                <span className='flex items-center gap-2'>
                  Dla organizacji
                  <Users className='h-4 w-4 group-hover:scale-110 transition-transform' />
                </span>
              </Link>
            </Button>

            <Button variant='outline' size='lg' asChild>
              <Link href='mailto:pwrnow.kontakt@gmail.com'>
                Skontaktuj się z nami
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
