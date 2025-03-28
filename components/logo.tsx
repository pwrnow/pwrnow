import Link from 'next/link';

export default function Logo() {
  return (
    <Link href='/' className='no-underline'>
      <h1 className='text-2xl sm:text-3xl md:text-3xl font-bold text-center gradient-text cursor-pointer transition-transform duration-300 hover:scale-110'>
        PWr Now
      </h1>
    </Link>
  );
}
