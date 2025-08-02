import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NoEventsMessage() {
  const t = useTranslations('NoEventsMessage');

  return (
    <div className='w-full mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 py-12 text-center'>
      <Link
        href='/'
        className='text-blue-600 hover:text-blue-800 hover:underline'
      >
        {t('viewAllEvents')}
      </Link>
    </div>
  );
}
