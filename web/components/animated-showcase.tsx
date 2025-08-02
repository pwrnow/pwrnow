'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AnimatedShowcase() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('AnimatedShowcase');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return <div className='w-full aspect-video bg-muted/20 rounded-xl'></div>;

  const isDark = theme === 'dark';

  return (
    <div className='w-full h-full aspect-video relative overflow-hidden rounded-xl'>
      {/* Background gradient */}
      <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10'></div>

      {/* Floating event cards */}
      <div className='relative w-full h-full'>
        {[...Array(8)].map((_, i) => (
          <EventCard key={i} index={i} isDark={isDark} t={t} />
        ))}
      </div>
    </div>
  );
}

// Component for a floating event card
function EventCard({
  index,
  isDark,
  t,
}: {
  index: number;
  isDark: boolean;
  t: any;
}) {
  const eventTitles = [
    t('aiWorkshop'),
    t('clubMeeting'),
    t('hackathon'),
    t('integrationTrip'),
    t('techTalk'),
    t('conference'),
    t('training'),
    t('jobFair'),
  ];

  // Generate distributed positions
  const getPosition = (idx: number) => {
    const positions = [
      { x: 15, y: 15 },
      { x: 50, y: 20 },
      { x: 85, y: 25 },
      { x: 20, y: 50 },
      { x: 70, y: 55 },
      { x: 10, y: 80 },
      { x: 45, y: 85 },
      { x: 80, y: 75 },
    ];
    return positions[idx % positions.length];
  };

  const pos = getPosition(index);
  const delay = index * 0.5;

  // Determine colors based on index
  const getColors = (idx: number) => {
    const colors = [
      'hsl(330, 80%, 55%)', // accent
      'hsl(250, 80%, 60%)', // primary
      'hsl(180, 80%, 45%)', // secondary
    ];
    return colors[idx % 3];
  };

  const borderColor = getColors(index);
  const size = index % 3 === 0 ? 35 : index % 3 === 1 ? 40 : 30;

  return (
    <div
      className={`absolute rounded-lg shadow-lg p-4 sm:p-5 transition-all duration-300 hover:scale-110 hover:z-30 cursor-pointer animate-float`}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: `${size}%`,
        backgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.07)'
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${borderColor}40`,
        boxShadow: `0 8px 32px ${borderColor}30`,
        zIndex: 10 + index,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className='h-2 sm:h-2.5 w-1/3 rounded-full mb-3'
        style={{
          background: `linear-gradient(to right, hsl(330, 80%, 55%), hsl(250, 80%, 60%), hsl(180, 80%, 45%))`,
        }}
      />
      <div
        className='text-sm sm:text-base font-medium mb-2'
        style={{ color: isDark ? 'hsl(330, 80%, 55%)' : 'hsl(250, 80%, 60%)' }}
      >
        {eventTitles[index]}
      </div>
      <div className='flex gap-2 items-center'>
        <div
          className='w-5 h-5 rounded-full'
          style={{
            background: `linear-gradient(135deg, hsl(330, 80%, 55%), hsl(250, 80%, 60%), hsl(180, 80%, 45%))`,
            opacity: 0.8,
          }}
        />
        <div className='text-xs sm:text-sm text-muted-foreground'>PWr</div>
      </div>
    </div>
  );
}
