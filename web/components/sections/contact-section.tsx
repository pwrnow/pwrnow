'use client';

import { Mail, MessageCircle, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    description: 'Najszybszy sposób na kontakt z naszym zespołem',
    action: 'pwrnow.kontakt@gmail.com',
    href: 'mailto:pwrnow.kontakt@gmail.com',
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    icon: MessageCircle,
    title: 'Zgłoś wydarzenie',
    description: 'Prześlij nam szczegóły swojego wydarzenia',
    action: 'Wyślij zgłoszenie',
    href: 'mailto:pwrnow.kontakt@gmail.com?subject=Zgłoszenie wydarzenia',
    color: 'from-green-500/20 to-green-600/20',
  },
  {
    icon: Clock,
    title: 'Czas odpowiedzi',
    description: 'Odpowiadamy w ciągu 24 godzin',
    action: 'Poniedziałek - Piątek',
    href: '#',
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    icon: Users,
    title: 'Społeczność',
    description: 'Dołącz do społeczności PWr Now',
    action: 'Dowiedz się więcej',
    href: '#funkcje',
    color: 'from-orange-500/20 to-orange-600/20',
  },
];

export default function ContactSection() {
  return (
    <section id='kontakt' className='py-24'>
      <div className='text-center mb-16'>
        <h2 className='text-3xl md:text-4xl font-bold mb-4 animate-fade-up'>
          Skontaktuj się z <span className='gradient-text'>nami</span>
        </h2>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up animate-delay-200'>
          Masz pytania lub chcesz dodać wydarzenie? Jesteśmy tutaj, aby Ci
          pomóc. Skontaktuj się z nami w najwygodniejszy dla Ciebie sposób.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-16'>
        {contactMethods.map((method, index) => (
          <Card
            key={index}
            className='group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50 animate-fade-up'
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className='p-6'>
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <method.icon className='h-6 w-6 text-primary' />
                  </div>
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300'>
                    {method.title}
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed mb-4'>
                    {method.description}
                  </p>
                  {method.href !== '#' ? (
                    <Button variant='outline' size='sm' asChild>
                      <Link href={method.href}>{method.action}</Link>
                    </Button>
                  ) : (
                    <p className='text-sm font-medium text-primary'>
                      {method.action}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className='text-center'>
        <div className='bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 max-w-2xl mx-auto animate-fade-up animate-delay-500'>
          <h3 className='text-2xl font-bold mb-4'>
            Gotowy na promowanie swojego wydarzenia?
          </h3>
          <p className='text-muted-foreground mb-6 text-lg'>
            Dołącz do setek organizacji, które już korzystają z PWr Now. Zacznij
            promować swoje wydarzenia już dziś!
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' className='group' asChild>
              <Link href='mailto:pwrnow.kontakt@gmail.com?subject=Zgłoszenie wydarzenia'>
                <span className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  Dodaj wydarzenie
                </span>
              </Link>
            </Button>

            <Button variant='outline' size='lg' asChild>
              <Link href='mailto:pwrnow.kontakt@gmail.com'>Zadaj pytanie</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
