import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        About the Circus Video Archive
      </h1>

      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Preserving FSU Flying High Circus History
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The FSU Flying High Circus has been a beloved tradition at Florida State University
              since 1947, making it one of only two collegiate circuses in the United States.
              Over the decades, thousands of student performers have dedicated countless hours
              to mastering their acts and entertaining audiences across the country.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This archive exists to preserve and celebrate that legacy. It&apos;s a community-driven
              collection of performance videos spanning multiple generations of circus performers,
              from classic acts to modern interpretations.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you&apos;re a former performer reliving memories, a current student looking for
              inspiration, or simply a fan of the circus, this archive is for you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How It Works
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">1.</span>
                <span>
                  <strong>Browse & Watch:</strong> Explore videos by act type, year, or performer.
                  Discover performances from across circus history.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">2.</span>
                <span>
                  <strong>Vote for Your Favorites:</strong> Each logged-in user can vote for one
                  video per act category. Performer votes count double, so tag yourself in videos
                  you performed in!
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">3.</span>
                <span>
                  <strong>Contribute:</strong> Have a circus video on YouTube? Log in and submit
                  it to the archive. Tag the performers to help build our community database.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">4.</span>
                <span>
                  <strong>Connect:</strong> Leave comments on videos to share memories, ask
                  questions, or connect with fellow circus alumni.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Built by Alumni, for Alumni
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              This project was created by a circus alumnus who wanted to give back to the
              community that shaped so much of their college experience. It&apos;s a labor of love,
              built with modern web technologies and designed to grow alongside our community.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Have ideas for new features? Found a bug? Want to help out? We&apos;d love to hear
              from you. This is a community project, and your input helps make it better.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/">
            <Button>Browse Videos</Button>
          </Link>
          <Link href="/support">
            <Button variant="outline">Support the Project</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
