import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Support the Developer
      </h1>

      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <img
                  src="/IMG_0641.jpeg"
                  alt="Joey Musselman - Developer"
                  className="w-48 h-48 object-cover rounded-lg shadow-md"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Hey, I&apos;m Joey!
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  I built the Circus Video Archive as a passion project to preserve and celebrate
                  the incredible performances from the FSU Flying High Circus. As a former circus
                  performer myself, I know how special these memories are to our community.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This project is entirely self-funded. I pay for hosting, domain costs, and spend
                  my free time developing new features and maintaining the platform. If you&apos;ve
                  enjoyed using the archive, consider buying me a coffee (or helping cover server
                  costs) with a small donation.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Every contribution, no matter how small, helps keep this project running and
                  motivates me to keep improving it for our circus family.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Support via Venmo
            </h2>
            <p className="text-gray-700 mb-6">
              Click the button below to send a tip via Venmo.
              Any amount is greatly appreciated!
            </p>
            <div className="flex flex-col items-center gap-4">
              <a
                href="https://venmo.com/Joey-Musselman"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="lg">
                  Send Tip via Venmo
                </Button>
              </a>
              <p className="text-sm text-gray-600">
                @Joey-Musselman
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Other Ways to Help
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">*</span>
                <span>
                  <strong>Share the archive</strong> with fellow circus alumni and performers.
                  The more people who know about it, the better our collection grows!
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">*</span>
                <span>
                  <strong>Submit your videos</strong> to help build the most comprehensive
                  collection of circus performances.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">*</span>
                <span>
                  <strong>Tag performers</strong> in videos to help connect our community
                  and make videos easier to find.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">*</span>
                <span>
                  <strong>Report bugs or suggest features</strong> to help improve the
                  platform for everyone.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <p className="text-gray-600 mb-4">
            Thank you for being part of our circus family!
          </p>
          <Link href="/about">
            <Button variant="outline">Learn More About the Project</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
