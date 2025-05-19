import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    redirect('/login');
  }

  // Check if user has admin role
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', user.data.user.id)
  //   .single();

  // if (profile?.role !== 'admin') {
  //   redirect('/');
  // }

  return <main className='flex-1 overflow-auto p-6'>{children}</main>;
}
