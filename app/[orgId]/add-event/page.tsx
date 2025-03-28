import AddEventForm from '@/components/add-event-form';
import { getOrganization } from '@/lib/organization';
import { getCategories } from '@/app/actions/categories';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    orgId: string;
  };
}

export default async function AddEventPage({ params }: PageProps) {
  const { orgId } = params;

  const organization = await getOrganization(orgId);
  const categories = await getCategories();

  if (!organization) {
    return notFound();
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-4'>
      <h1 className='text-2xl font-bold mb-4 text-center'>Utwórz wydarzenie</h1>
      <AddEventForm
        organizationId={organization.id}
        categories={categories}
        orgCode={organization.code}
      />
    </div>
  );
}
