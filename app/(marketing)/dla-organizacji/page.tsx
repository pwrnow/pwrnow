import { Metadata } from 'next';
import HeroSection from '@/components/sections/hero-section';
import FeaturesSection from '@/components/sections/features-section';
import HowItWorksSection from '@/components/sections/how-it-works-section';
import FaqSection from '@/components/sections/faq-section';
import ContactSection from '@/components/sections/contact-section';

export const metadata: Metadata = {
  title: 'PWr Now - Dla organizacji studenckich',
  description:
    'Promuj swoje wydarzenia na PWr Now! Platforma dla organizacji studenckich, kół naukowych i samorządów Politechniki Wrocławskiej.',
  keywords: [
    'wydarzenia studenckie',
    'Politechnika Wrocławska',
    'organizacje studenckie',
    'koła naukowe',
    'samorząd studencki',
    'promocja wydarzeń',
    'PWr',
    'Wrocław',
  ],
  openGraph: {
    title: 'PWr Now - Dla organizacji studenckich',
    description:
      'Promuj swoje wydarzenia na PWr Now! Platforma dla organizacji studenckich, kół naukowych i samorządów Politechniki Wrocławskiej.',
  },
};

export default function OrganizationsPage() {
  return (
    <div className='container mx-auto px-4 max-w-6xl space-y-32 py-12'>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FaqSection />
      <ContactSection />
    </div>
  );
}
