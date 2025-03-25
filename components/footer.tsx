export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='w-full py-4 border-t border-muted bg-background/95 backdrop-blur-md mt-4'>
      <div className='mx-auto px-3 text-center'>
        <p className='text-xs text-muted-foreground'>
          © {currentYear} PWR Now. Twoje centrum wydarzeń na Politechnice
          Wrocławskiej. Zrobione z ❤️ dla społeczności akademickiej.
        </p>
      </div>
    </footer>
  );
}
