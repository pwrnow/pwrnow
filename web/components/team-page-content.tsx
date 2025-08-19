'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';

// Team member data - showcasing professional expertise and individual achievements
const teamMembers = [
  {
    id: 1,
    name: "Michał Kowalski",
    description: "Full-Stack Developer & Technical Lead with expertise in modern web technologies. Architected PWr Now's scalable infrastructure using React, Next.js, and Django. Passionate about clean code, performance optimization, and delivering exceptional user experiences. Experienced in leading technical projects from conception to deployment.",
    image: "https://picsum.photos/seed/michal/400/500",
    social: {
      github: "https://github.com/michal",
      linkedin: "https://linkedin.com/in/michal",
      email: "michal@pwrnow.pl"
    }
  },
  {
    id: 2,
    name: "Anna Wiśniewska",
    description: "Senior UX/UI Designer specializing in user-centered design and brand development. Created PWr Now's complete design system and user experience strategy. Expert in design thinking, prototyping, and converting complex user needs into intuitive interfaces. Proven track record in creating engaging digital experiences.",
    image: "https://picsum.photos/seed/anna/400/500",
    social: {
      linkedin: "https://linkedin.com/in/anna",
      email: "anna@pwrnow.pl"
    }
  },
  {
    id: 3,
    name: "Jakub Nowak",
    description: "Digital Marketing Strategist & Community Growth Specialist. Built PWr Now's user acquisition strategy and community engagement programs. Experienced in data-driven marketing, social media strategy, and product growth. Successfully scaled user base through innovative marketing campaigns and partnerships.",
    image: "https://picsum.photos/seed/jakub/400/500",
    social: {
      github: "https://github.com/jakub",
      linkedin: "https://linkedin.com/in/jakub",
      email: "jakub@pwrnow.pl"
    }
  }
];

export default function TeamPageContent() {
  const t = useTranslations('TeamPage');
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Geometric Shapes with Enhanced Movement */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-1 h-1 bg-primary/40 rounded-full"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.4, 0.8, 0.4],
            x: [0, 30, -10, 20, 0],
            y: [0, -20, 15, -30, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent/30 rounded-full"
          animate={{
            scale: [0.5, 1.5, 0.8, 1.2, 0.5],
            opacity: [0.3, 0.7, 0.5, 0.8, 0.3],
            x: [0, -40, 15, -25, 0],
            y: [0, 25, -10, 35, 0],
            rotate: [0, -180, -360]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        <motion.div
          className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-secondary/35 rounded-full"
          animate={{
            scale: [1, 1.8, 0.8, 1.5, 1],
            opacity: [0.35, 0.65, 0.45, 0.75, 0.35],
            x: [0, 20, -15, 25, 0],
            y: [0, -15, 20, -25, 0],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />

        {/* Additional Floating Elements */}
        <motion.div
          className="absolute top-1/5 right-1/3 w-3 h-3 bg-primary/20 rounded-full"
          animate={{
            scale: [0.5, 1.2, 0.7, 1.5, 0.5],
            opacity: [0.2, 0.6, 0.4, 0.8, 0.2],
            x: [0, -60, 30, -40, 0],
            y: [0, 40, -20, 30, 0],
            rotate: [0, 120, 240, 360]
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        <motion.div
          className="absolute bottom-1/4 right-1/5 w-2.5 h-2.5 bg-accent/25 rounded-full"
          animate={{
            scale: [0.8, 1.6, 1, 1.4, 0.8],
            opacity: [0.25, 0.7, 0.45, 0.65, 0.25],
            x: [0, 50, -20, 35, 0],
            y: [0, -30, 25, -40, 0],
            rotate: [0, -90, -180, -270, -360]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6
          }}
        />

        <motion.div
          className="absolute top-2/3 left-1/5 w-1.5 h-1.5 bg-secondary/30 rounded-full"
          animate={{
            scale: [1, 2.2, 0.6, 1.8, 1],
            opacity: [0.3, 0.8, 0.4, 0.7, 0.3],
            x: [0, 35, -25, 45, 0],
            y: [0, -35, 15, -25, 0],
            rotate: [0, 240, 480]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 8
          }}
        />

        {/* Organic Flowing Lines with Enhanced Patterns */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none">
          {/* Main flowing paths */}
          <motion.path
            d="M0,300 Q200,100 400,300 T800,300 Q1000,200 1200,300"
            stroke="url(#gradient1)"
            strokeWidth="1"
            fill="none"
            opacity={0.15}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <motion.path
            d="M1200,500 Q1000,300 800,500 T400,500 Q200,600 0,500"
            stroke="url(#gradient2)"
            strokeWidth="1"
            fill="none"
            opacity={0.12}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
          />

          <motion.path
            d="M600,0 Q500,200 600,400 T600,800"
            stroke="url(#gradient3)"
            strokeWidth="0.8"
            fill="none"
            opacity={0.08}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 10
            }}
          />

          {/* Additional Dynamic Wave Patterns */}
          <motion.path
            d="M0,150 Q300,50 600,150 Q900,250 1200,150"
            stroke="url(#gradient4)"
            strokeWidth="0.8"
            fill="none"
            opacity={0.1}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0.5, 1, 0],
              opacity: [0, 0.1, 0.15, 0.1, 0]
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 15
            }}
          />

          <motion.path
            d="M1200,650 Q900,550 600,650 Q300,750 0,650"
            stroke="url(#gradient5)"
            strokeWidth="0.6"
            fill="none"
            opacity={0.08}
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: [0, 0.7, 1, 0.3, 0],
              opacity: [0, 0.08, 0.12, 0.06, 0]
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 18
            }}
          />

          {/* Diagonal flowing streams */}
          <motion.path
            d="M0,0 Q300,200 600,100 Q900,0 1200,200"
            stroke="url(#gradient6)"
            strokeWidth="0.5"
            fill="none"
            opacity={0.06}
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: [0, 1, 0.2, 0.8, 0],
              opacity: [0, 0.06, 0.1, 0.04, 0]
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 22
            }}
          />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="30%" stopColor="hsl(var(--accent))" stopOpacity="1" />
              <stop offset="70%" stopColor="hsl(var(--secondary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient5" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
              <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient6" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Enhanced Particle System with More Movement */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-foreground/20 rounded-full"
            style={{
              left: `${15 + (i * 8)}%`,
              top: `${25 + (i * 6)}%`,
            }}
            animate={{
              y: [-30, 40, -20, 30, -25],
              x: [-10, 15, -5, 20, -15],
              opacity: [0.1, 0.4, 0.2, 0.5, 0.1],
              scale: [0.8, 1.5, 1, 1.8, 0.8],
              rotate: [0, 180, 90, 270, 360]
            }}
            transition={{
              duration: 20 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1.2
            }}
          />
        ))}

        {/* Additional Floating Particles with Different Behaviors */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`floating-${i}`}
            className={`absolute rounded-full ${i % 3 === 0 ? 'w-1 h-1 bg-primary/25' : i % 3 === 1 ? 'w-0.5 h-0.5 bg-accent/30' : 'w-1.5 h-1.5 bg-secondary/20'}`}
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${40 + (i * 5)}%`,
            }}
            animate={{
              y: [0, -50, 30, -40, 0],
              x: [0, 25, -15, 35, 0],
              opacity: [0.2, 0.7, 0.3, 0.6, 0.2],
              scale: [1, 0.5, 1.5, 0.8, 1],
              rotate: [0, 90, 180, 270, 360]
            }}
            transition={{
              duration: 25 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2.5
            }}
          />
        ))}

        {/* Scroll-Responsive Floating Elements */}
        <motion.div
          className="absolute top-1/2 left-1/4 w-8 h-8 border border-primary/20 rounded-full"
          style={{ y }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        />

        <motion.div
          className="absolute bottom-1/3 right-1/4 w-6 h-6 border border-accent/15 rounded-full"
          style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
          animate={{
            rotate: [360, 0],
            scale: [0.8, 1.3, 0.8],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 },
            opacity: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }
          }}
        />

        {/* Enhanced Breathing Light Effect with Multiple Layers */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.02, 0.05, 0.02]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-primary/10 via-accent/5 to-transparent rounded-full blur-3xl" />
        </motion.div>

        {/* Secondary breathing light */}
        <motion.div
          className="absolute top-1/3 right-1/3 w-64 h-64 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1.2, 0.6, 1.2],
            opacity: [0.03, 0.08, 0.03],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-accent/8 via-secondary/4 to-transparent rounded-full blur-2xl" />
        </motion.div>

        {/* Tertiary ambient light */}
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [0.6, 1.4, 0.6],
            opacity: [0.025, 0.06, 0.025],
            rotate: [360, 0]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 12
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-secondary/6 via-primary/3 to-transparent rounded-full blur-3xl" />
        </motion.div>
      </div>

      {/* Simple Hero Section */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground">
              {t('hero.title')}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-24">
            {teamMembers.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>


      {/* Enhanced Call to Action */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Background decoration */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 rounded-3xl blur-3xl"
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <div className="relative bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border border-border/50 rounded-3xl p-12 lg:p-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-foreground">
                  {t('cta.title')}
                </h3>
                <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t('cta.subtitle')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <motion.a
                  href="/kontakt"
                  className="group relative inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl overflow-hidden"
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary to-accent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <Mail className="w-5 h-5 mr-3 relative z-10" />
                  <span className="relative z-10">{t('cta.button')}</span>
                </motion.a>

              </motion.div>

              {/* Floating decorative elements */}
              <motion.div
                className="absolute -top-4 -left-4 w-8 h-8 bg-primary/20 rounded-full blur-md"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-6 -right-6 w-6 h-6 bg-accent/20 rounded-full blur-md"
                animate={{
                  scale: [0.8, 1.3, 0.8],
                  opacity: [0.4, 0.7, 0.4],
                  rotate: [360, 0]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// Individual team member component with enhanced styling and transitions
function TeamMemberCard({ member, index }: { member: typeof teamMembers[0], index: number }) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 20,
          delay: index * 0.15
        }
      } : { opacity: 0, y: 60 }}
      className="group relative"
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.5 }}
      />

      <div className={`relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}>

        {/* Enhanced Image Section */}
        <motion.div
          className="relative flex-shrink-0"
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.4, ease: "easeOut" }
          }}
        >
          <div className="relative w-80 h-96 lg:w-80 lg:h-96">
            {/* Enhanced animated border with multiple layers */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: `conic-gradient(from ${index * 120}deg, hsl(var(--primary)/0.3), hsl(var(--accent)/0.4), hsl(var(--secondary)/0.3), hsl(var(--primary)/0.3))`
              }}
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Secondary rotating border */}
            <motion.div
              className="absolute inset-1 rounded-3xl"
              style={{
                background: `conic-gradient(from ${-index * 120}deg, hsl(var(--accent)/0.2), hsl(var(--secondary)/0.3), hsl(var(--primary)/0.2), hsl(var(--accent)/0.2))`
              }}
              animate={{
                rotate: [360, 0]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Image container with enhanced styling */}
            <div className="absolute inset-2 bg-background rounded-3xl overflow-hidden shadow-2xl">
              <motion.img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : { scale: 1.1, opacity: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.4 }
                }}
              />

              {/* Enhanced overlay effects */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                transition={{ duration: 0.4 }}
              />

              {/* Floating accent elements */}
              <motion.div
                className="absolute top-4 right-4 w-3 h-3 bg-primary/60 rounded-full opacity-0 group-hover:opacity-100"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Content Section */}
        <div className="flex-1 space-y-8 relative">
          {/* Enhanced background decoration */}
          <motion.div
            className="absolute -left-6 top-0 w-1.5 h-full bg-gradient-to-b from-primary/40 via-accent/30 to-secondary/40 rounded-full"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={isInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          />

          <motion.div
            initial={{ opacity: 0, x: isEven ? -30 : 30 }}
            animate={isInView ? {
              opacity: 1,
              x: 0,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: 0.3
              }
            } : { opacity: 0, x: isEven ? -30 : 30 }}
          >
            {/* Enhanced name with better typography */}
            <motion.div
              className="relative mb-6"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 relative">
                {member.name}
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-full"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "80%" } : { width: 0 }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
              </h3>
            </motion.div>

            {/* Enhanced description */}
            <motion.p
              className="text-muted-foreground leading-relaxed text-lg lg:text-xl mb-8"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {member.description}
            </motion.p>
          </motion.div>

          {/* Enhanced Social Links */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {member.social.github && (
              <motion.a
                href={member.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center overflow-hidden backdrop-blur-sm border border-border/50"
                whileHover={{
                  scale: 1.1,
                  y: -3,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <Github size={20} className="text-muted-foreground group-hover:text-foreground transition-colors relative z-10" />
              </motion.a>
            )}
            {member.social.linkedin && (
              <motion.a
                href={member.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center overflow-hidden backdrop-blur-sm border border-border/50"
                whileHover={{
                  scale: 1.1,
                  y: -3,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <Linkedin size={20} className="text-muted-foreground group-hover:text-foreground transition-colors relative z-10" />
              </motion.a>
            )}
            {member.social.email && (
              <motion.a
                href={`mailto:${member.social.email}`}
                className="group relative w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center overflow-hidden backdrop-blur-sm border border-border/50"
                whileHover={{
                  scale: 1.1,
                  y: -3,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <Mail size={20} className="text-muted-foreground group-hover:text-foreground transition-colors relative z-10" />
              </motion.a>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
