'use client';

import { Target, TrendingUp, Users2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const benefits = [
  {
    icon: Target,
    title: 'Dotrzij do większej grupy',
    description:
      'Promuj swoje wydarzenia wśród całej społeczności PWr i zwiększ frekwencję.',
  },
  {
    icon: TrendingUp,
    title: 'Zwiększ widoczność',
    description:
      'Twoja organizacja zyska rozpoznawalność wśród studentów wszystkich wydziałów.',
  },
  {
    icon: Users2,
    title: 'Buduj społeczność',
    description: 'Łącz się z innymi organizacjami i twórz wspólne inicjatywy.',
  },
  {
    icon: Zap,
    title: 'Szybkie dodawanie',
    description:
      'Intuicyjny panel pozwala szybko dodawać i edytować wydarzenia.',
  },
];

export default function OrganizationsSection() {
  return (
    <section id='dla-organizacji' className='py-24'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
        {/* Content */}
        <div className='space-y-8'>
          <div className='space-y-6'>
            <h2 className='text-3xl md:text-4xl font-bold animate-fade-right'>
              Dla organizacji <span className='gradient-text'>studenckich</span>
            </h2>
            <p className='text-lg text-muted-foreground animate-fade-right animate-delay-200'>
              Jesteś przedstawicielem koła naukowego, samorządu studentów lub
              organizacji studenckiej? PWr Now to idealne miejsce do promocji
              Twoich wydarzeń!
            </p>
          </div>

          <div className='space-y-4 animate-fade-right animate-delay-400'>
            {benefits.map((benefit, index) => (
              <div key={index} className='flex items-start space-x-4 group'>
                <div className='flex-shrink-0'>
                  <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <benefit.icon className='h-5 w-5 text-primary' />
                  </div>
                </div>
                <div>
                  <h3 className='font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300'>
                    {benefit.title}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className='pt-6 animate-fade-right animate-delay-600'>
            <Button size='lg' className='group' asChild>
              <Link href='mailto:pwrnow.kontakt@gmail.com?subject=Dołączenie organizacji do PWr Now&body=Cześć PWr Now Team!%0D%0A%0D%0AJestem zainteresowany/a dodaniem wydarzeń mojej organizacji do Waszej platformy.%0D%0A%0D%0ANazwa organizacji: %0D%0AStrona/social media: %0D%0AKrótki opis działalności: %0D%0A%0D%0AProszę o informacje jak możemy rozpocząć współpracę.%0D%0A%0D%0APozdrawiam,'>
                <span className='flex items-center gap-2'>
                  Dołącz do nas
                  <Users2 className='h-4 w-4 group-hover:scale-110 transition-transform' />
                </span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Visual representation */}
        <div className='relative animate-fade-left animate-delay-300'>
          <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl blur-xl'></div>
          <Card className='relative bg-background/80 backdrop-blur-sm border-border/50'>
            <CardContent className='p-8'>
              <div className='space-y-6'>
                <div className='text-center'>
                  <h3 className='text-xl font-bold mb-2 gradient-text'>
                    Panel Organizacji
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Zarządzaj wydarzeniami z łatwością
                  </p>
                </div>

                {/* Mock interface elements */}
                <div className='space-y-4'>
                  <div className='bg-primary/10 rounded-lg p-4 border border-primary/20'>
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='w-3 h-3 rounded-full bg-primary'></div>
                      <div className='text-sm font-medium'>
                        Hackathon PWr 2025
                      </div>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      15 stycznia 2025 • Aktywne
                    </div>
                  </div>

                  <div className='bg-secondary/10 rounded-lg p-4 border border-secondary/20'>
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='w-3 h-3 rounded-full bg-secondary'></div>
                      <div className='text-sm font-medium'>Warsztaty React</div>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      20 stycznia 2025 • W przygotowaniu
                    </div>
                  </div>

                  <div className='bg-accent/10 rounded-lg p-4 border border-accent/20'>
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='w-3 h-3 rounded-full bg-accent'></div>
                      <div className='text-sm font-medium'>
                        Spotkanie koła AI
                      </div>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      25 stycznia 2025 • Planowane
                    </div>
                  </div>
                </div>

                <Button size='sm' className='w-full' variant='outline'>
                  + Dodaj nowe wydarzenie
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
