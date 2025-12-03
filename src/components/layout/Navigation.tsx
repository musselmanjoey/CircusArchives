'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const navItems = [
  { href: '/videos', label: 'Browse' },
  { href: '/submit', label: 'Submit Video' },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-blue-600',
            pathname === item.href ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          {item.label}
        </Link>
      ))}

      {status === 'loading' ? (
        <span className="text-sm text-gray-400">...</span>
      ) : session?.user ? (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {session.user.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign Out
          </Button>
        </div>
      ) : (
        <Link href="/login">
          <Button variant="primary" size="sm">
            Sign In
          </Button>
        </Link>
      )}
    </nav>
  );
}
