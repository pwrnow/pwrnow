'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AnimatedShowcase from '@/components/animated-showcase';
import { ArrowRight, Calendar } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className='flex flex-col lg:flex-row gap-12 items-center relative min-h-[80vh] py-12'>
      <div className='lg:w-1/2 space-y-8 z-10'>
        <div className='space-y-6'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold animate-fade-up animate-duration-1000 animate-delay-300'>
            Centrum wydarzeń{' '}
            <span className='gradient-text'>Politechniki Wrocławskiej</span>
          </h1>
          <p className='text-lg md:text-xl text-muted-foreground animate-fade-up animate-duration-1000 animate-delay-500 max-w-2xl'>
            Bądź na bieżąco z najnowszymi wydarzeniami na PWr. Odkrywaj
            warsztaty, konferencje, spotkania kół naukowych i wiele więcej w
            jednym miejscu.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 animate-fade-up animate-duration-1000 animate-delay-700'>
          <Button size='lg' className='group relative overflow-hidden' asChild>
            <Link href='#jak-to-dziala'>
              <span className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Przeglądaj wydarzenia
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </span>
            </Link>
          </Button>

          <Button variant='outline' size='lg' asChild>
            <Link href='#dla-organizacji'>Dla organizacji</Link>
          </Button>
        </div>
      </div>

      <div className='lg:w-1/2 relative animate-fade-left animate-duration-1000 animate-delay-300'>
        <div className='absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-50 animate-pulse animate-duration-5000'></div>
        <div className='relative rounded-xl overflow-hidden shadow-2xl'>
          <AnimatedShowcase />
        </div>
      </div>
    </section>
  );
}
