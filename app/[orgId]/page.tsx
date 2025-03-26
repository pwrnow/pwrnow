import { notFound } from 'next/navigation';
import { getOrganization } from '@/lib/organizations';
import AddEventForm from '@/components/add-event-form';

interface PageProps {
  params: {
    orgId: string;
  };
}

export default async function OrganizationPage({ params }: PageProps) {
  const { orgId } = await params;
  const organization = await getOrganization(orgId);

  if (!organization) {
    notFound();
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-4'>
      <h1 className='text-2xl font-bold mb-4 text-center'>Utwórz wydarzenie</h1>
      <AddEventForm organizationId={orgId} />
    </div>
  );
}
