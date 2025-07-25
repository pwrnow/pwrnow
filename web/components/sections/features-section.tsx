'use client';

import { Calendar, Users, Bell, Filter, Smartphone, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Calendar,
    title: 'Wszystkie wydarzenia w jednym miejscu',
    description:
      'Nie przegap ważnych wydarzeń. Wszystkie aktywności na PWr zebrane w jednej aplikacji.',
  },
  {
    icon: Filter,
    title: 'Inteligentne filtrowanie',
    description:
      'Znajdź wydarzenia, które Cię interesują dzięki zaawansowanym filtrom według kategorii i organizacji.',
  },
  {
    icon: Users,
    title: 'Społeczność PWr',
    description:
      'Połącz się ze społecznością akademicką i odkryj nowe możliwości rozwoju.',
  },
  {
    icon: Bell,
    title: 'Powiadomienia',
    description:
      'Otrzymuj informacje o nowych wydarzeniach i ważnych aktualizacjach.',
  },
  {
    icon: Smartphone,
    title: 'Dostępność mobilna',
    description:
      'Korzystaj z PWr Now na telefonie, tablecie i komputerze - wszędzie i zawsze.',
  },
  {
    icon: Globe,
    title: 'Dla całej uczelni',
    description:
      'Platforma łączy wszystkie wydziały, koła naukowe i organizacje studenckie.',
  },
];

export default function FeaturesSection() {
  return (
    <section id='funkcje' className='py-24'>
      <div className='text-center mb-16'>
        <h2 className='text-3xl md:text-4xl font-bold mb-4 animate-fade-up'>
          Dlaczego warto wybrać <span className='gradient-text'>PWr Now</span>?
        </h2>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up animate-delay-200'>
          Odkryj wszystkie zalety nowoczesnej platformy wydarzeń akademickich
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {features.map((feature, index) => (
          <Card
            key={index}
            className='group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50 animate-fade-up'
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className='p-6'>
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <div className='w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <feature.icon className='h-6 w-6 text-primary' />
                  </div>
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300'>
                    {feature.title}
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
