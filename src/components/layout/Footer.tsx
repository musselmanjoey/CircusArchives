import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-garnet-dark text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                <span className="text-xl">🎪</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Circus Archive</h3>
                <p className="text-gold text-sm">FSU Flying High Circus</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Preserving and celebrating the legacy of the FSU Flying High Circus
              since 1947. A community-driven archive for performers past and present.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/70 hover:text-white transition-colors text-sm">
                  Best Videos
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-white/70 hover:text-white transition-colors text-sm">
                  Browse All
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-white/70 hover:text-white transition-colors text-sm">
                  Submit Video
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/70 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/support" className="text-white/70 hover:text-white transition-colors text-sm">
                  Support the Developer
                </Link>
              </li>
              <li>
                <a
                  href="https://circus.fsu.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                >
                  Official FSU Circus Site
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://fsucircusalumni.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                >
                  Circus Alumni Association
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-white/50">
            <p>&copy; {currentYear} Circus Video Archive. Built with love by alumni.</p>
            <p className="flex items-center gap-1">
              <span className="text-gold">Go Noles!</span> 🍢
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
