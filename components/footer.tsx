export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='w-full py-4 border-t border-muted bg-background/95 backdrop-blur-md mt-4'>
      <div className='mx-auto px-3 text-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl'>
        <p className='text-xs text-muted-foreground'>
          © {currentYear} PWr Now. Twoje centrum wydarzeń na Politechnice
          Wrocławskiej. Zrobione z ❤️ dla społeczności akademickiej.
        </p>
      </div>
    </footer>
  );
}
