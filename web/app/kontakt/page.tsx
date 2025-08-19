import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  Send,
  ArrowRight,
} from 'lucide-react';
import { CONTACT_CONFIG, SOCIAL_LINKS } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ContactPage');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations('ContactPage');

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='relative max-w-4xl mx-auto px-6 pt-20 pb-12 text-center'>
        <h1
          className='text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight animate-slide-up opacity-0'
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
        >
          <span className='gradient-text'>{t('pageTitle')}</span>
        </h1>
        <p
          className='text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-slide-up opacity-0'
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          {t('pageSubtitle')}
        </p>
      </header>

      {/* Contact Grid */}
      <section className='relative max-w-6xl mx-auto px-6 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {[
            {
              icon: Mail,
              color: 'primary',
              title: t('contact.email.title'),
              desc: t('contact.email.description'),
              href: `mailto:${CONTACT_CONFIG.EMAIL}`,
              label: t('contact.email.button'),
            },
            {
              icon: MessageCircle,
              color: 'primary',
              title: t('contact.messenger.title'),
              desc: t('contact.messenger.description'),
              href: SOCIAL_LINKS.MESSENGER,
              label: t('contact.messenger.button'),
            },
            {
              icon: Facebook,
              color: 'primary',
              title: t('contact.facebook.title'),
              desc: t('contact.facebook.description'),
              href: SOCIAL_LINKS.FACEBOOK,
              label: t('contact.facebook.button'),
            },
            {
              icon: Instagram,
              color: 'accent',
              title: t('contact.instagram.title'),
              desc: t('contact.instagram.description'),
              href: SOCIAL_LINKS.INSTAGRAM,
              label: t('contact.instagram.button'),
            },
          ].map((item, i) => (
            <div
              key={i}
              className='group bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up opacity-0'
              style={{
                animationDelay: `${400 + i * 150}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <div
                className={`w-14 h-14 mb-4 rounded-xl flex items-center justify-center bg-${item.color}/10 group-hover:bg-${item.color}/20 transition-colors`}
              >
                <item.icon className={`w-7 h-7 text-${item.color}`} />
              </div>
              <h3 className='text-xl font-bold mb-2'>{item.title}</h3>
              <p className='text-muted-foreground mb-4 leading-relaxed'>
                {item.desc}
              </p>
              <a
                href={item.href}
                target='_blank'
                rel='noopener noreferrer'
                className={`inline-flex items-center px-4 py-2.5 rounded-xl font-semibold bg-${item.color} text-${item.color}-foreground hover:bg-${item.color}/90 transition-all duration-200 shadow-md hover:shadow-lg`}
              >
                <item.icon className='w-4 h-4 mr-2' />
                {item.label}
                <ArrowRight className='w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200' />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className='relative max-w-5xl mx-auto px-6 py-12'>
        <div
          className='text-center mb-10 animate-slide-up opacity-0'
          style={{ animationDelay: '1050ms', animationFillMode: 'forwards' }}
        >
          <h2 className='text-3xl sm:text-4xl font-bold mb-3'>
            {t('faq.title')}
          </h2>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            {t('faq.subtitle')}
          </p>
        </div>
        <div className='grid gap-4'>
          {[...Array(8)].map((_, i) => {
            const num = i + 1;
            return (
              <div
                key={num}
                className='faq-item group cursor-pointer transition-all duration-300 rounded-2xl p-5 bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/40 hover:shadow-md animate-slide-up opacity-0'
                style={{
                  animationDelay: `${1200 + i * 100}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-bold group-hover:bg-primary/20 transition-colors'>
                    {num}
                  </div>
                  <div>
                    <h3 className='text-lg sm:text-xl font-semibold mb-1 group-hover:text-primary transition-colors'>
                      {t(`faq.questions.${num}.question`)}
                    </h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      {num === 7 || num === 8
                        ? t(`faq.questions.${num}.answer`, {
                            email: CONTACT_CONFIG.EMAIL,
                          })
                        : t(`faq.questions.${num}.answer`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className='relative max-w-5xl mx-auto px-6 py-16'>
        <div
          className='relative overflow-hidden rounded-3xl p-8 text-center bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-border/40 shadow-xl animate-slide-up opacity-0'
          style={{ animationDelay: '2000ms', animationFillMode: 'forwards' }}
        >
          <h3 className='text-3xl sm:text-4xl font-extrabold gradient-text mb-3'>
            {t('cta.title')}
          </h3>
          <p className='text-xl text-muted-foreground mb-6 max-w-2xl mx-auto'>
            {t('cta.subtitle')}
          </p>
          <a
            href={`mailto:${CONTACT_CONFIG.EMAIL}`}
            className='inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
          >
            <Send className='w-5 h-5 mr-2' />
            {t('cta.button')}
            <ArrowRight className='w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200' />
          </a>
        </div>
      </section>
    </div>
  );
}
