import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import TeamPageContent from '@/components/team-page-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('TeamPage');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function TeamPage() {
  return <TeamPageContent />;
}
