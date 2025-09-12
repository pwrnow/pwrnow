'use client';

import { Github, Linkedin, Mail, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Team member data - showcasing professional expertise and individual achievements
const teamMembers = [
  {
    id: 1,
    name: "Michał Mendzelewski",
    description: "Full-Stack Developer & Co-Founder with expertise in modern web technologies and backend systems. Architected PWr Now's scalable infrastructure using React, Next.js, and Django. Passionate about clean code, performance optimization, and delivering exceptional user experiences. Experienced in leading technical projects from conception to deployment.",
    image: null,
    social: {
      github: "https://github.com/michallm",
      linkedin: "https://linkedin.com/in/michal",
      email: "michal@pwrnow.pl"
    }
  },
  {
    id: 2,
    name: "Igor Lis",
    description: "Full-Stack Developer & Co-Founder with expertise in modern web technologies and mobile development. Built PWr Now's core platform using React, Next.js, and React Native. Passionate about creating seamless user experiences across web and mobile platforms. Experienced in full-stack development, API design, and scalable architecture solutions.",
    image: "/team_pics/lis.jpg",
    social: {
      linkedin: "https://www.linkedin.com/in/igor-lis/",
      github: "https://github.com/foxjustfox",
      email: "igor@pwrnow.pl"
    }
  },
  {
    id: 3,
    name: "Kuba Królak",
    description: "Digital Marketing Strategist & Community Growth Specialist. Built PWr Now's user acquisition strategy and community engagement programs. Experienced in data-driven marketing, social media strategy, and product growth. Successfully scaled user base through innovative marketing campaigns and partnerships.",
    image: "team_pics/krolak.jpg",
    social: {
      github: "https://github.com/jakub",
      linkedin: "https://linkedin.com/in/jakub",
      email: "jakub@pwrnow.pl"
    }
  }
];

export default function TeamPageContent() {
  const t = useTranslations('TeamPage');

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-bold gradient-text animate-slide-up">
            {t('hero.title')}
          </h1>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-24">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className="animate-slide-up"
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animationFillMode: 'both'
                }}
              >
                <TeamMemberCard
                  member={member}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border border-border/50 rounded-3xl p-12 lg:p-16 text-center animate-slide-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            <div className="mb-8">
              <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-foreground">
                {t('cta.title')}
              </h3>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('cta.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/kontakt"
                className="group relative inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors duration-200"
              >
                <Mail className="w-5 h-5 mr-3" />
                <span>{t('cta.button')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Individual team member component with clean, elegant styling
function TeamMemberCard({ member, index }: { member: typeof teamMembers[0], index: number }) {
  const isEven = index % 2 === 0;

  return (
    <div className="group relative">
      <div className={`relative flex flex-col ${!isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}>
        {/* Image Section - only show if image exists */}
        {member.image && (
          <div className="relative flex-shrink-0 animate-float-gentle" style={{ animationDelay: `${index * 0.5}s` }}>
          <div className="relative w-80 h-96 lg:w-80 lg:h-96">
              {/* Simple border */}
              <div className="absolute inset-0 rounded-3xl border-2 border-border/20" />
              
              {/* Image container */}
              <div className="absolute inset-2 bg-background rounded-3xl overflow-hidden shadow-lg">
                <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 space-y-8 relative">
          {/* Simple accent line */}
          <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-primary/60 via-accent/40 to-secondary/60 rounded-full" />

          <div>
            {/* Name */}
            <div className="relative mb-6">
              <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {member.name}
              </h3>
              <div className="h-1 w-20 bg-gradient-to-r from-primary via-accent to-secondary rounded-full" />
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed text-lg lg:text-xl mb-8">
              {member.description}
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            {member.social.github && (
              <a
                href={member.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200"
              >
                <Github size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            )}
            {member.social.linkedin && (
              <a
                href={member.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200"
              >
                <Linkedin size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            )}
            {member.social.email && (
              <a
                href={`mailto:${member.social.email}`}
                className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200"
              >
                <Mail size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
