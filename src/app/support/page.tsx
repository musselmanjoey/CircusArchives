import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SupportPage() {
  return (
    <div className="min-h-[80vh]">
      {/* Hero Section */}
      <section className="bg-gradient-garnet text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Support the Developer
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Help keep this passion project running for our circus community
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* About Me Card */}
          <Card variant="elevated">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="shrink-0 mx-auto md:mx-0">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-lg ring-4 ring-gold/30">
                    <img
                      src="/IMG_0641.jpeg"
                      alt="Joey Musselman - Developer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-semibold text-text mb-4">
                    Hey, I&apos;m Joey!
                  </h2>
                  <div className="space-y-4 text-text-secondary leading-relaxed">
                    <p>
                      I built the Circus Video Archive as a passion project to preserve and celebrate
                      the incredible performances from the FSU Flying High Circus. As a former circus
                      performer myself, I know how special these memories are to our community.
                    </p>
                    <p>
                      This project is entirely self-funded. I pay for hosting, domain costs, and spend
                      my free time developing new features and maintaining the platform. If you&apos;ve
                      enjoyed using the archive, consider buying me a coffee (or helping cover server
                      costs) with a small donation.
                    </p>
                    <p>
                      Every contribution, no matter how small, helps keep this project running and
                      motivates me to keep improving it for our circus family.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venmo CTA */}
          <Card variant="featured">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-garnet rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text mb-2">
                Support via Venmo
              </h2>
              <p className="text-text-muted mb-6 max-w-md mx-auto">
                Click the button below to send a tip via Venmo.
                Any amount is greatly appreciated!
              </p>
              <a
                href="https://venmo.com/Joey-Musselman"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="gold" size="lg" className="shadow-lg">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5zM12 17.5H6v-2h6v2zm0-4H6v-2h6v2zm6-4H6v-2h12v2z" />
                  </svg>
                  Send Tip via Venmo
                </Button>
              </a>
              <p className="text-sm text-text-muted mt-4">
                @Joey-Musselman
              </p>
            </CardContent>
          </Card>

          {/* Other Ways Card */}
          <Card variant="elevated">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-text mb-1">
                    Other Ways to Help
                  </h2>
                  <p className="text-text-muted text-sm">You can contribute without spending a dime</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    ),
                    title: 'Share the archive',
                    desc: 'with fellow circus alumni and performers. The more people who know about it, the better our collection grows!',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    ),
                    title: 'Submit your videos',
                    desc: 'to help build the most comprehensive collection of circus performances.',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    title: 'Tag performers',
                    desc: 'in videos to help connect our community and make videos easier to find.',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    title: 'Report bugs or suggest features',
                    desc: 'to help improve the platform for everyone.',
                  },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center shrink-0 text-gold-dark">
                      {item.icon}
                    </div>
                    <p className="text-text-secondary">
                      <strong className="text-text">{item.title}</strong> {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <div className="text-center pt-4">
            <p className="text-text-muted mb-4">
              Thank you for being part of our circus family!
            </p>
            <Link href="/about">
              <Button variant="outline">Learn More About the Project</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
