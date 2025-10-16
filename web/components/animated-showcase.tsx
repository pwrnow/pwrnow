'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AnimatedShowcase() {
  const t = useTranslations('AnimatedShowcase');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className='w-full aspect-video'></div>;

  // Use PWr Now logo colors (matching the gradient-text from globals.css)
  const isDark = theme === 'dark';
  // Converting HSL values from globals.css to hex
  const primaryColor = 'hsl(250, 80%, 60%)'; // Primary purple from logo
  const secondaryColor = 'hsl(180, 80%, 45%)'; // Secondary teal from logo
  const accentColor = 'hsl(330, 80%, 55%)'; // Accent pink/magenta from logo
  const backgroundColor = isDark ? '#1e1e2e' : '#f8fafc';
  const textColor = isDark ? '#e2e8f0' : '#334155';

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

  return (
    <div className='w-full h-full aspect-video relative'>
      {/* More floating event cards, spread across the space */}
      <div className='relative w-full h-full'>
        {[...Array(8)].map((_, i) => (
          <EventCard
            key={i}
            index={i}
            primaryColor={primaryColor}
            accentColor={accentColor}
            secondaryColor={secondaryColor}
            backgroundColor={backgroundColor}
            textColor={textColor}
            isDark={isDark}
            title={eventTitles[i]}
          />
        ))}
      </div>
    </div>
  );
}

// Component for a floating event card
function EventCard({
  index,
  primaryColor,
  accentColor,
  secondaryColor,
  backgroundColor,
  textColor,
  isDark,
  title,
}: {
  index: number;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  isDark: boolean;
  title: string;
}) {
  // More positions spread across the space

  // Generate distributed positions across the entire space
  const getPosition = (idx: number) => {
    // Create a grid pattern for better distribution
    // We'll use a 3x3 grid to place our cards
    const gridX = [15, 50, 85]; // % across width
    const gridY = [15, 50, 85]; // % across height

    // Map index to grid position, but add some randomness
    const randomOffset = 12; // random offset to avoid perfect grid
    const xOffset = (Math.random() * 2 - 1) * randomOffset;
    const yOffset = (Math.random() * 2 - 1) * randomOffset;

    const gridPos = idx % 9;
    const gridRow = Math.floor(gridPos / 3);
    const gridCol = gridPos % 3;

    return {
      x: gridX[gridCol] + xOffset,
      y: gridY[gridRow] + yOffset,
    };
  };

  const pos = getPosition(index);
  const delay = index * 0.4;

  // Determine which color to use based on index
  const borderColor =
    index % 3 === 0
      ? accentColor
      : index % 3 === 1
      ? primaryColor
      : secondaryColor;

  // Vary the sizes a bit
  const size = index % 3 === 0 ? '35%' : index % 3 === 1 ? '40%' : '30%';

  return (
    <motion.div
      className='absolute rounded-lg shadow-lg p-4 sm:p-5'
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: size,
        backgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.07)'
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${borderColor}40`,
        boxShadow: `0 8px 32px ${borderColor}30`,
        zIndex: 10 + index,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [(pos.y - 50) * 0.1, (pos.y - 50) * 0.1 - 10, (pos.y - 50) * 0.1], // Movement based on position
        rotate: [0, index % 2 === 0 ? 1 : -1, 0],
      }}
      transition={{
        duration: 5 + (index % 3),
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
        opacity: { duration: 1 },
      }}
      whileHover={{
        scale: 1.1,
        boxShadow: `0 12px 40px ${borderColor}50`,
        zIndex: 30,
        transition: { duration: 0.2 },
      }}
    >
      <div
        className='h-2 sm:h-2.5 w-1/3 rounded-full mb-3'
        style={{
          background: `linear-gradient(to right, ${accentColor}, ${primaryColor}, ${secondaryColor})`,
        }}
      />
      <div
        className='text-sm sm:text-base font-medium mb-2'
        style={{ color: isDark ? accentColor : primaryColor }}
      >
        {title}
      </div>
      <div className='flex gap-2 items-center'>
        <div
          className='w-5 h-5 rounded-full'
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${primaryColor}, ${secondaryColor})`,
            opacity: 0.8,
          }}
        />
        <div className='text-xs sm:text-sm' style={{ color: textColor }}>
          PWr
        </div>
      </div>
    </motion.div>
  );
}


