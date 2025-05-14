'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function AnimatedShowcase() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return <div className='w-full aspect-video rounded-xl bg-accent/20'></div>;

  // Use PWr Now logo colors
  const isDark = theme === 'dark';
  // PWr Now purple colors
  const primaryColor = '#6c5ce7'; // Main purple from logo
  const accentColor = '#a29bfe'; // Lighter purple accent
  const backgroundColor = isDark ? '#1e1e2e' : '#f8fafc';
  const textColor = isDark ? '#e2e8f0' : '#334155';

  return (
    <div className='w-full h-full aspect-video relative overflow-visible rounded-xl'>
      {/* Background with animated gradient - expanded beyond container */}
      <motion.div
        className='absolute -inset-8 bg-gradient-to-br rounded-[2rem]'
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${primaryColor}40, ${accentColor}40)`,
        }}
        animate={{
          background: [
            `linear-gradient(to bottom right, ${primaryColor}40, ${accentColor}40)`,
            `linear-gradient(to bottom left, ${accentColor}40, ${primaryColor}40)`,
            `linear-gradient(to top right, ${primaryColor}40, ${accentColor}40)`,
            `linear-gradient(to bottom right, ${primaryColor}40, ${accentColor}40)`,
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating event cards - expanded positioning */}
      {[...Array(5)].map((_, i) => (
        <EventCard
          key={i}
          index={i}
          primaryColor={primaryColor}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
          textColor={textColor}
          isDark={isDark}
        />
      ))}

      {/* Central PWr Now logo/element - using logo colors */}
      <motion.div
        className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center'
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 2, 0, -2, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className='relative flex items-center justify-center'>
          <motion.div
            className='absolute inset-0 rounded-full blur-lg'
            style={{ backgroundColor: primaryColor, opacity: 0.3 }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className='text-3xl sm:text-5xl font-bold relative z-10 p-5 rounded-full backdrop-blur-md'
            style={{
              background: `linear-gradient(135deg, rgba(20, 20, 35, 0.7), rgba(30, 30, 60, 0.4))`,
              border: `2px solid ${primaryColor}80`,
              color: accentColor,
              textShadow: `0 0 10px ${primaryColor}80`,
            }}
          >
            PWr Now
          </div>
        </div>
      </motion.div>

      {/* Decorative elements - expanded beyond container */}
      <DecorativeCircles
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}

// Component for a floating event card
function EventCard({
  index,
  primaryColor,
  accentColor,
  backgroundColor,
  textColor,
  isDark,
}: {
  index: number;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isDark: boolean;
}) {
  // Calculate position and delay based on index - expanded positioning
  const positions = [
    { x: -30, y: -20 },
    { x: 35, y: 20 },
    { x: -35, y: 25 },
    { x: 30, y: -30 },
    { x: 5, y: 40 },
  ];

  const titles = [
    'Warsztaty AI',
    'Spotkanie koła',
    'Hackathon PWr',
    'Wyjście integracyjne',
    'Tech Talk',
  ];

  const pos = positions[index];
  const delay = index * 0.5;

  return (
    <motion.div
      className='absolute rounded-lg shadow-xl p-3 sm:p-4 w-28 sm:w-36 md:w-52'
      style={{
        x: `${pos.x}%`,
        y: `${pos.y}%`,
        backgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${index % 2 === 0 ? primaryColor : accentColor}60`,
        boxShadow: `0 4px 20px ${primaryColor}40`,
        zIndex: index + 10,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [`${pos.y}%`, `${pos.y - 8}%`, `${pos.y}%`],
        rotate: [0, index % 2 === 0 ? 3 : -3, 0],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
        opacity: { duration: 1 },
      }}
      whileHover={{
        scale: 1.08,
        boxShadow: `0 8px 32px ${primaryColor}60`,
        transition: { duration: 0.2 },
      }}
    >
      <div
        className='h-2 sm:h-3 w-1/3 rounded-full mb-2'
        style={{
          background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
        }}
      />
      <div
        className='text-xs sm:text-sm font-medium mb-1'
        style={{ color: isDark ? accentColor : primaryColor }}
      >
        {titles[index]}
      </div>
      <div className='flex gap-1 items-center'>
        <div
          className='w-5 h-5 rounded-full'
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            opacity: 0.8,
          }}
        />
        <div className='text-xs' style={{ color: textColor }}>
          PWr
        </div>
      </div>
    </motion.div>
  );
}

// Component for decorative animated circles - expanded beyond container
function DecorativeCircles({
  primaryColor,
  accentColor,
}: {
  primaryColor: string;
  accentColor: string;
}) {
  return (
    <>
      {[...Array(12)].map((_, i) => {
        const size = Math.random() * 160 + 80;
        const x = Math.random() * 130 - 15; // Allow positioning outside container
        const y = Math.random() * 130 - 15; // Allow positioning outside container
        const opacity = Math.random() * 0.15 + 0.05;
        const duration = Math.random() * 15 + 15;
        const delay = Math.random() * 5;

        // Create gradient colors between primary and accent
        const colorBlend = i / 12;
        const r =
          parseInt(primaryColor.slice(1, 3), 16) * (1 - colorBlend) +
          parseInt(accentColor.slice(1, 3), 16) * colorBlend;
        const g =
          parseInt(primaryColor.slice(3, 5), 16) * (1 - colorBlend) +
          parseInt(accentColor.slice(3, 5), 16) * colorBlend;
        const b =
          parseInt(primaryColor.slice(5, 7), 16) * (1 - colorBlend) +
          parseInt(accentColor.slice(5, 7), 16) * colorBlend;
        const color = `rgb(${r}, ${g}, ${b})`;

        return (
          <motion.div
            key={i}
            className='absolute rounded-full blur-lg'
            style={{
              width: size,
              height: size,
              x: `${x}%`,
              y: `${y}%`,
              backgroundColor: color,
              opacity,
              zIndex: 1,
            }}
            animate={{
              x: [`${x}%`, `${x + (Math.random() * 15 - 7.5)}%`],
              y: [`${y}%`, `${y + (Math.random() * 15 - 7.5)}%`],
              scale: [1, Math.random() * 0.7 + 0.8, 1],
              opacity: [opacity, opacity * 1.5, opacity],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </>
  );
}
