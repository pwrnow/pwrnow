import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CONTACT_CONFIG, SOCIAL_LINKS } from '@/lib/config';
import { SocialIcon } from 'react-social-icons';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations('Footer');

  const socialIcons = [
    { network: 'facebook', href: SOCIAL_LINKS.FACEBOOK, label: 'Facebook' },
    { network: 'instagram', href: SOCIAL_LINKS.INSTAGRAM, label: 'Instagram' },
    { network: 'tiktok', href: SOCIAL_LINKS.TIKTOK, label: 'TikTok' },
  ];

  return (
    <footer className='w-full py-6 border-t border-muted bg-background/95 backdrop-blur-md'>
      <div className='mx-auto px-3 text-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl space-y-4'>
        {/* Social Media Icons */}
        <div className='flex justify-center items-center gap-2'>
          {socialIcons.map((social) => (
            <SocialIcon
              key={social.label}
              network={social.network}
              url={social.href}
              target='_blank'
              rel='noopener noreferrer'
              className='hover:scale-110 transition-transform duration-200'
              aria-label={social.label}
              style={{ width: 32, height: 32 }}
              fgColor='currentColor'
              bgColor='transparent'
            />
          ))}
        </div>

        {/* Navigation Links */}
        <div className='flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-sm'>
          <Link
            href='/dla-organizacji'
            className='text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline flex items-center gap-1'
          >
            <span>✨</span> {t('forOrganizations')}
          </Link>
          <Link
            href='/kontakt'
            className='text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline flex items-center gap-1'
          >
            <span>✉️</span> {t('contact')}
          </Link>
          <Link
            href='/polityka-prywatnosci'
            className='text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline flex items-center gap-1'
          >
            <span>🔒</span> {t('privacyPolicy')}
          </Link>
        </div>

        {/* Copyright */}
        <p className='text-xs text-muted-foreground'>
          {t('copyright', { year: currentYear })}
        </p>
      </div>
    </footer>
  );
}
