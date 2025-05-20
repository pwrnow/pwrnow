import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Admin Panel</h1>
      </div>
    </div>
  );
}
