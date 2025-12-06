import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <div className="min-h-[80vh]">
      {/* Hero Section */}
      <section className="bg-gradient-garnet text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            About the Circus Archive
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Preserving and celebrating the legacy of the FSU Flying High Circus since 1947
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* History Card */}
          <Card variant="elevated">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-2xl">🎪</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-text mb-1">
                    Preserving FSU Flying High Circus History
                  </h2>
                  <p className="text-text-muted text-sm">A legacy spanning decades</p>
                </div>
              </div>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  The FSU Flying High Circus has been a beloved tradition at Florida State University
                  since 1947, making it one of only two collegiate circuses in the United States.
                  Over the decades, thousands of student performers have dedicated countless hours
                  to mastering their acts and entertaining audiences across the country.
                </p>
                <p>
                  This archive exists to preserve and celebrate that legacy. It&apos;s a community-driven
                  collection of performance videos spanning multiple generations of circus performers,
                  from classic acts to modern interpretations.
                </p>
                <p>
                  Whether you&apos;re a former performer reliving memories, a current student looking for
                  inspiration, or simply a fan of the circus, this archive is for you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How it Works Card */}
          <Card variant="elevated">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-garnet/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-garnet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-text mb-1">
                    How It Works
                  </h2>
                  <p className="text-text-muted text-sm">Simple steps to participate</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  {
                    num: '1',
                    title: 'Browse & Watch',
                    desc: 'Explore videos by act type, year, or performer. Discover performances from across circus history.',
                  },
                  {
                    num: '2',
                    title: 'Vote for Your Favorites',
                    desc: 'Each logged-in user can vote for one video per act category. Performer votes count double, so tag yourself in videos you performed in!',
                  },
                  {
                    num: '3',
                    title: 'Contribute',
                    desc: 'Have a circus video on YouTube? Log in and submit it to the archive. Tag the performers to help build our community database.',
                  },
                  {
                    num: '4',
                    title: 'Connect',
                    desc: 'Leave comments on videos to share memories, ask questions, or connect with fellow circus alumni.',
                  },
                ].map((item) => (
                  <li key={item.num} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center shrink-0">
                      <span className="text-garnet-dark font-bold text-sm">{item.num}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{item.title}</h3>
                      <p className="text-text-secondary text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Built by Alumni Card */}
          <Card variant="elevated">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-text mb-1">
                    Built by Alumni, for Alumni
                  </h2>
                  <p className="text-text-muted text-sm">A labor of love</p>
                </div>
              </div>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  This project was created by a circus alumnus who wanted to give back to the
                  community that shaped so much of their college experience. It&apos;s a labor of love,
                  built with modern web technologies and designed to grow alongside our community.
                </p>
                <p>
                  Have ideas for new features? Found a bug? Want to help out? We&apos;d love to hear
                  from you. This is a community project, and your input helps make it better.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="bg-spotlight border-2 border-gold rounded-2xl p-6 sm:p-8 text-center">
            <h3 className="text-xl font-semibold text-text mb-2">Ready to explore?</h3>
            <p className="text-text-muted mb-6">
              Start browsing the archive or contribute by submitting a video.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button size="lg">Browse Videos</Button>
              </Link>
              <Link href="/support">
                <Button variant="outline" size="lg">Support the Project</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
