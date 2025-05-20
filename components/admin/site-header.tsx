'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export function SiteHeader() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  // Map paths to readable titles
  const pathTitles: Record<string, string> = {
    admin: 'Admin',
    events: 'Wydarzenia',
    organizations: 'Organizacje',
  };

  return (
    <header className='group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-4'
        />
        <Breadcrumb>
          <BreadcrumbList>
            {paths.map((path, index) => {
              const href = `/${paths.slice(0, index + 1).join('/')}`;
              const isLast = index === paths.length - 1;

              return (
                <BreadcrumbItem key={path}>
                  {isLast ? (
                    <BreadcrumbPage>{pathTitles[path] || path}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>
                      {pathTitles[path] || path}
                    </BreadcrumbLink>
                  )}
                  {!isLast && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
