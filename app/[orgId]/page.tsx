import { notFound } from 'next/navigation';
import AddEventForm from '@/components/add-event-form';
import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

// This would be replaced with actual database lookup
const getOrganization = async (orgId: string) => {
  // Temporary mock data
  const organizations: Record<string, { name: string }> = {
    'wrrs-djffna3': { name: 'WRRS' },
    // Add more organizations as needed
  };

  return organizations[orgId] || null;
};

interface PageProps {
  params: Promise<{ orgId: string }>;
}

export default async function OrganizationPage({ params }: PageProps) {
  const { orgId } = await params;
  const organization = await getOrganization(orgId);

  if (!organization) {
    notFound();
  }

  return (
    <main className='flex min-h-screen flex-col items-center bg-background'>
      <div className='w-full mx-auto'>
        <header className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md'>
          <div className='flex justify-between items-center p-2 sm:p-3'>
            <div className='w-10'></div>
            <Link href='/'>
              <Logo />
            </Link>
            <div className='w-10 flex justify-end'>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className='max-w-2xl mx-auto px-4 py-4'>
          <h1 className='text-2xl font-bold mb-4 text-center'>
            Utwórz wydarzenie
          </h1>
          <AddEventForm organizationId={orgId} />
        </div>
      </div>
    </main>
  );
}
