'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/videos', label: 'Browse' },
  { href: '/submit', label: 'Submit Video' },
];

export function Navigation() {
  const pathname = usePathname();

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
    </nav>
  );
}
