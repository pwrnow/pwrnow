import { createClient } from '@/utils/supabase/server';

export async function getOrganization(orgCode: string) {
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from('organizations')
    .select()
    .eq('code', orgCode)
    .single();

  return organization;
}
