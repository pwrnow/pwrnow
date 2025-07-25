import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='w-full py-6 border-t border-muted bg-background/95 backdrop-blur-md'>
      <div className='mx-auto px-3 text-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl space-y-4'>
        <div className='flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-sm'>
          <Link
            href='/dla-organizacji'
            className='text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline flex items-center gap-1'
          >
            <span>✨</span> Dla organizacji
          </Link>
          <a
            href='mailto:pwrnow.kontakt@gmail.com'
            className='text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline flex items-center gap-1'
          >
            <span>✉️</span> Kontakt
          </a>
        </div>
        <p className='text-xs text-muted-foreground'>
          © {currentYear} PWr Now. Twoje centrum wydarzeń na Politechnice
          Wrocławskiej. Zrobione z ❤️ dla społeczności akademickiej.
        </p>
      </div>
    </footer>
  );
}
