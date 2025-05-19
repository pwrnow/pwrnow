'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Linkedin, Mail, Github, Instagram } from 'lucide-react';
import { useRef } from 'react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

// Background elements animation variants
const floatingCircleVariants = {
  animate: (custom: number) => ({
    y: [0, -15, 0],
    x: [0, custom, 0],
    transition: {
      duration: 4 + Math.abs(custom / 10),
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image: string;
  socials: {
    linkedin?: string;
    github?: string;
    email?: string;
    instagram?: string;
  };
}

// Team members data
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Jan Kowalski',
    role: 'Założyciel & CEO',
    bio: 'Pasjonat technologii i student Politechniki Wrocławskiej, stworzył PWr Now, aby ułatwić społeczności akademickiej dostęp do informacji o wydarzeniach.',
    image: '/team/placeholder1.jpg',
    socials: {
      linkedin: 'https://linkedin.com/',
      github: 'https://github.com/',
      email: 'kontakt@pwrnow.pl',
    },
  },
  {
    id: 2,
    name: 'Anna Nowak',
    role: 'Lead Developer',
    bio: 'Specjalistka od frontendu z pasją do tworzenia intuicyjnych interfejsów użytkownika. Odpowiedzialna za techniczne aspekty PWr Now.',
    image: '/team/placeholder2.jpg',
    socials: {
      linkedin: 'https://linkedin.com/',
      github: 'https://github.com/',
      instagram: 'https://instagram.com/',
    },
  },
  {
    id: 3,
    name: 'Tomasz Wiśniewski',
    role: 'UI/UX Designer',
    bio: 'Kreatywny designer z okiem do szczegółów. Tworzy wizualną stronę PWr Now, dbając o estetykę i przyjazność platformy.',
    image: '/team/placeholder3.jpg',
    socials: {
      linkedin: 'https://linkedin.com/',
      instagram: 'https://instagram.com/',
      email: 'design@pwrnow.pl',
    },
  },
];

export default function TeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div
      ref={containerRef}
      className='relative container max-w-6xl py-12 px-4 sm:px-6 overflow-hidden'
    >
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden -z-10 opacity-70'>
        <motion.div
          className='absolute top-40 right-10 w-60 h-60 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl'
          animate={{
            y: [0, -15, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className='absolute bottom-40 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-indigo-500/10 to-pink-500/10 blur-xl'
          animate={{
            y: [0, -10, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className='absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 blur-xl'
          animate={{
            y: [0, -20, 0],
            x: [0, 8, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* SVG gradient line - simplified and fixed animation */}
        <div className='absolute inset-0 w-full h-full overflow-hidden'>
          <svg
            className='w-full'
            height='300'
            xmlns='http://www.w3.org/2000/svg'
            preserveAspectRatio='none'
          >
            <motion.path
              d='M0,100 C250,180 450,20 700,100 C950,180 1150,20 1400,100'
              style={{
                y: backgroundY,
              }}
              stroke='url(#gradient)'
              strokeWidth='2'
              strokeDasharray='1500'
              strokeDashoffset={useTransform(
                scrollYProgress,
                [0, 0.5],
                [1500, 0]
              )}
              fill='none'
            />
            <defs>
              <linearGradient id='gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor='#4f46e5' stopOpacity='0.3' />
                <stop offset='50%' stopColor='#8b5cf6' stopOpacity='0.5' />
                <stop offset='100%' stopColor='#3b82f6' stopOpacity='0.3' />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className='text-center mb-20 relative'
      >
        <motion.h1
          className='text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent relative'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Nasz Zespół
        </motion.h1>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '120px' }}
          transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
          className='h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6 rounded-full'
        />
        <motion.p
          className='text-xl text-muted-foreground max-w-3xl mx-auto relative z-10'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Poznaj osoby, które stoją za PWr Now - platformą łączącą społeczność
          Politechniki Wrocławskiej z najciekawszymi wydarzeniami.
        </motion.p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, amount: 0.2 }}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10'
      >
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.id}
            variants={itemVariants}
            whileHover={{
              y: -10,
              transition: { duration: 0.3 },
            }}
          >
            <Card className='overflow-hidden hover:shadow-xl transition-all duration-500 bg-gradient-to-b from-background to-background/50 backdrop-blur-sm border-t-2 border-t-primary/20 h-full'>
              <CardContent className='p-8 relative'>
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: 0.1 * index,
                  }}
                  className='mb-8 flex justify-center'
                >
                  <Avatar className='h-36 w-36 border-4 border-primary/20 shadow-lg shadow-primary/5'>
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback>
                      {member.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <h3 className='text-2xl font-bold mb-1 text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text'>
                  {member.name}
                </h3>
                <p className='text-primary text-sm font-medium mb-4 text-center'>
                  {member.role}
                </p>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '40%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + 0.1 * index }}
                  className='h-0.5 bg-gradient-to-r from-primary/20 to-primary/60 mx-auto mb-6 rounded-full'
                />
                <p className='text-muted-foreground text-sm mb-6'>
                  {member.bio}
                </p>

                <div className='flex justify-center space-x-6'>
                  {member.socials.linkedin && (
                    <Link
                      href={member.socials.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <motion.div
                        whileHover={{ y: -5 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <Linkedin className='h-5 w-5 text-muted-foreground hover:text-foreground hover:text-[#0072b1]' />
                      </motion.div>
                    </Link>
                  )}
                  {member.socials.github && (
                    <Link
                      href={member.socials.github}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <motion.div
                        whileHover={{ y: -5 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <Github className='h-5 w-5 text-muted-foreground hover:text-foreground hover:text-[#333]' />
                      </motion.div>
                    </Link>
                  )}
                  {member.socials.email && (
                    <Link href={`mailto:${member.socials.email}`}>
                      <motion.div
                        whileHover={{ y: -5 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <Mail className='h-5 w-5 text-muted-foreground hover:text-foreground hover:text-[#ea4335]' />
                      </motion.div>
                    </Link>
                  )}
                  {member.socials.instagram && (
                    <Link
                      href={member.socials.instagram}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <motion.div
                        whileHover={{ y: -5 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <Instagram className='h-5 w-5 text-muted-foreground hover:text-foreground hover:text-[#e4405f]' />
                      </motion.div>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
