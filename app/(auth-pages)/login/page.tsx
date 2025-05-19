import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signInWithGoogle } from '@/app/actions/auth';

export default function SignInPage() {
  return (
    <div className='container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10'>
      <div className='relative w-full max-w-md'>
        {/* Gradient background effect */}
        <div className='absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-50 animate-pulse animate-duration-5000'></div>

        <Card className='relative'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center gradient-text'>
              Witaj w PWr Now
            </CardTitle>
            <CardDescription className='text-center'>
              Zaloguj się, aby uzyskać dostęp do wszystkich funkcji
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form action={signInWithGoogle}>
              <Button
                variant='outline'
                className='w-full group relative overflow-hidden'
                type='submit'
              >
                <span className='relative z-10 flex items-center justify-center gap-2'>
                  <svg
                    className='h-4 w-4'
                    aria-hidden='true'
                    focusable='false'
                    data-prefix='fab'
                    data-icon='google'
                    role='img'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 488 512'
                  >
                    <path
                      fill='currentColor'
                      d='M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z'
                    ></path>
                  </svg>
                  Zaloguj się przez Google
                </span>
                <span className='absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 -translate-y-full group-hover:translate-y-0 transition-transform duration-300'></span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
