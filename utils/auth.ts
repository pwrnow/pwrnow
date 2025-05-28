import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Musisz być zalogowany, aby wykonać tę akcję');
  }

  // Fetch user profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw new Error('Błąd podczas sprawdzania uprawnień');
  }

  if (!profile || profile.role !== 'admin') {
    throw new Error('Nie masz uprawnień do wykonania tej akcji');
  }

  return user;
}
