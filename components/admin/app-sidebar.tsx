'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Building,
  HelpCircle,
  Settings,
  ArrowUpCircle,
  Navigation,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

import { NavMain } from '@/components/admin/nav-main';
import { NavSecondary } from '@/components/admin/nav-secondary';
import { NavUser } from '@/components/admin/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<{
    name?: string;
    email?: string;
    avatar_url?: string;
  }>({});
  const supabase = createClient();

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) return;

        // Fetch user profile data from the profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({
          name: profileData?.name || authUser.user_metadata?.name || '',
          email: authUser.email || '',
          avatar_url:
            profileData?.avatar_url || authUser.user_metadata?.avatar_url || '',
        });
      } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
      }
    }

    loadUserProfile();
  }, [supabase]);

  const navMainItems = [
    {
      title: 'Wydarzenia',
      url: '/admin/events',
      icon: Calendar,
    },
    {
      title: 'Organizacje',
      url: '/admin/organizations',
      icon: Building,
    },
  ];

  const navSecondaryItems = [
    {
      title: 'Strona główna',
      url: '/',
      icon: Navigation,
    },
  ];

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:!p-1.5'
            >
              <a href='/admin'>
                <ArrowUpCircle className='h-5 w-5' />
                <span className='text-base font-semibold'>Panel Admina</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
