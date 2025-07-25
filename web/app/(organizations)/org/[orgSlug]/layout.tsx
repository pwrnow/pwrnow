import Link from 'next/link';

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <div className='flex-1'>
        {/* PWr Now Logo */}
        <div className='w-full bg-background/95 backdrop-blur border-b'>
          <div className='w-full mx-auto max-w-6xl px-4 py-4'>
            <div className='flex justify-center'>
              <span className='text-2xl font-bold display-font gradient-text'>
                PWr Now
              </span>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className='w-full mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8'>
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className='border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='w-full mx-auto max-w-7xl px-4 py-6'>
          <div className='flex flex-col items-center space-y-4'>
            {/* Footer Links */}
            <div className='flex items-center space-x-6'>
              <Link
                href='/'
                className='inline-flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                <span>✨</span>
                <span>Dla organizacji</span>
              </Link>
              <a
                href='mailto:kontakt@pwrnow.pl'
                className='inline-flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                <span>✉️</span>
                <span>Kontakt</span>
              </a>
            </div>

            {/* Copyright */}
            <div className='text-center text-sm text-muted-foreground'>
              <p>
                © 2025 PWr Now. Twoje centrum wydarzeń na Politechnice
                Wrocławskiej.
              </p>
              <p className='mt-1'>
                Zrobione z <span className='text-red-500'>❤️</span> dla
                społeczności akademickiej.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
