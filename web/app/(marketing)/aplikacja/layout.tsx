import { redirect } from 'next/navigation';

const APP_LAUNCH_DATE = new Date('2025-10-27T12:00:00');

export default function AppLaunchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const now = new Date();

  // Check if current time is before the launch date
  if (now < APP_LAUNCH_DATE) {
    redirect('/');
  }

  return <>{children}</>;
}
