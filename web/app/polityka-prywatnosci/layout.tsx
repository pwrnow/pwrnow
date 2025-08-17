import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getUserLocale } from '@/lib/locale';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('PrivacyPolicy');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  };
}

export default async function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('PrivacyPolicy');
  const currentLocale = await getUserLocale();

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header currentLocale={currentLocale} />
      <main className='flex-grow w-full mx-auto'>
        <div className='container mx-auto px-4 py-8 max-w-4xl'>
          {/* Header with back button */}
          <div className='mb-8'>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4'
            >
              <ArrowLeft className='h-4 w-4' />
              {t('backToHome')}
            </Link>
          </div>

          {/* Content */}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
