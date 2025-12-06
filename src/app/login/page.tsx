'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        firstName,
        lastName,
        redirect: false,
      });

      if (result?.error) {
        setError('Failed to sign in. Please try again.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md" variant="elevated">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 bg-gradient-garnet rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-garnet">
          <span className="text-3xl">🎪</span>
        </div>
        <CardTitle className="text-2xl">Welcome to the Archive</CardTitle>
        <p className="text-text-muted mt-2">
          Enter your name to join the circus community
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="firstName"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            required
            disabled={isLoading}
            autoComplete="given-name"
          />
          <Input
            id="lastName"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            required
            disabled={isLoading}
            autoComplete="family-name"
          />

          {error && (
            <div className="bg-error-light border border-error/20 text-error rounded-lg p-3 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !firstName.trim() || !lastName.trim()}
            isLoading={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-text-muted">
            Your name will be associated with videos you submit and comments you leave.
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-garnet hover:text-garnet-dark transition-colors">
            &larr; Back to home
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md" variant="elevated">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 skeleton rounded-2xl mx-auto mb-4" />
        <div className="h-7 skeleton rounded w-48 mx-auto mb-2" />
        <div className="h-5 skeleton rounded w-64 mx-auto" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <div className="h-5 skeleton rounded w-20 mb-1.5" />
            <div className="h-11 skeleton rounded-lg" />
          </div>
          <div>
            <div className="h-5 skeleton rounded w-20 mb-1.5" />
            <div className="h-11 skeleton rounded-lg" />
          </div>
          <div className="h-12 skeleton rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
