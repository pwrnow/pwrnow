import { notFound } from 'next/navigation';
import OrganizationImageForm from '@/components/organization-image-form';
import { getOrganization } from '@/lib/organization';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: {
    orgCode: string;
  };
}

export default async function OrganizationSettingsPage({ params }: PageProps) {
  const { orgCode } = await params;

  const organization = await getOrganization(orgCode);

  if (!organization) {
    return notFound();
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-4'>
      <div className='flex items-center mb-6'>
        <Link href={`/${orgCode}`}>
          <Button variant='ghost' size='sm' className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            <span>Powrót</span>
          </Button>
        </Link>
        <h1 className='text-2xl font-bold ml-4'>Ustawienia organizacji</h1>
      </div>

      <div className='space-y-8'>
        <div className='bg-card rounded-lg border p-6'>
          <h2 className='text-xl font-semibold mb-4'>Zdjęcie organizacji</h2>
          <p className='text-muted-foreground mb-6'>
            Zaktualizuj zdjęcie profilu Twojej organizacji, które będzie
            widoczne na stronie organizacji i przy wydarzeniach.
          </p>
          <OrganizationImageForm organization={organization} />
        </div>
      </div>
    </div>
  );
}
