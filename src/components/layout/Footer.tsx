import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500 text-sm">
          <p>Preserving circus performance history for future generations.</p>
          <div className="mt-3 flex justify-center gap-4">
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              About
            </Link>
            <span>|</span>
            <Link href="/support" className="hover:text-blue-600 transition-colors">
              Support the Developer
            </Link>
          </div>
          <p className="mt-3">&copy; {currentYear} Circus Video Archive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
