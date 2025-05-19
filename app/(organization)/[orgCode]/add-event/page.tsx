import AddEventForm from '@/components/add-event-form';
import { getOrganization } from '@/lib/organization';
import { getCategories } from '@/app/actions/categories';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: {
    orgCode: string;
  };
}

export default async function AddEventPage({ params }: PageProps) {
  const { orgCode } = await params;

  const organization = await getOrganization(orgCode);
  const categories = await getCategories();

  if (!organization) {
    return notFound();
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-4'>
      <div className='mb-4'>
        <div className='absolute'>
          <Link href={`/${orgCode}`}>
            <Button variant='ghost' size='sm' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              <span>Powrót</span>
            </Button>
          </Link>
        </div>
        <h1 className='text-2xl font-bold text-center'>Utwórz wydarzenie</h1>
      </div>
      <AddEventForm
        organizationId={organization.id}
        categories={categories}
        orgCode={organization.code}
      />
    </div>
  );
}
