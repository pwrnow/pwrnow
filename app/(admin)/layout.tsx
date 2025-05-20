import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/lib/user';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== ('admin' as UserRole)) {
    redirect('/');
  }

  return <main className='flex-1 overflow-auto p-6'>{children}</main>;
}
