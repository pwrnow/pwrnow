export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='w-full py-6 border-t border-muted bg-background/95 backdrop-blur-md mt-8'>
      <div className='container mx-auto px-4 text-center'>
        <p className='text-xs text-muted-foreground'>
          © {currentYear} PWR Now. Twoje centrum wydarzeń na Politechnice
          Wrocławskiej. Zrobione z ❤️ dla społeczności akademickiej.
        </p>
      </div>
    </footer>
  );
}
