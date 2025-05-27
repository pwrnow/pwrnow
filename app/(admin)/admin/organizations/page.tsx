import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { OrganizationsTable } from './organizations-table';

interface Organization {
  id: string;
  name: string;
  image_url: string | null;
  code: string | null;
  created_at: string;
}

export default async function OrganizationsPage() {
  const supabase = await createClient();

  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching organizations:', error);
    return <div>Error loading organizations. Please try again later.</div>;
  }

  return (
    <>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Organizacje</h1>
        <p className='text-muted-foreground'>
          Zarządzaj organizacjami i ich wydarzeniami
        </p>
      </div>

      <OrganizationsTable organizations={organizations || []} />
    </>
  );
}
