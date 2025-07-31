export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='max-w-2xl w-full mx-auto pt-2 sm:pt-4'>{children}</div>
  );
}
