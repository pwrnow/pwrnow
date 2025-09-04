'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Organization } from '@/lib/types';

interface OrganizationHeaderProps {
  organization: Organization;
}

export default function OrganizationHeader({
  organization,
}: OrganizationHeaderProps) {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  return (
    <div className='mb-8 bg-card rounded-lg border overflow-hidden'>
      <div className='bg-gradient-to-r from-primary/10 to-secondary/10 p-6'>
        <div className='flex items-center gap-5'>
          <Avatar className='w-16 h-16 border-2 border-primary/30 shadow-md'>
            <AvatarImage
              src={organization.image_url || undefined}
              alt={organization.name}
            />
            <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold'>
              {getInitials(organization.name)}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold display-font'>
              {organization.name}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
