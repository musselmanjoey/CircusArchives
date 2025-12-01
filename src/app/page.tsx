import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Circus Video Archive
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Preserving and celebrating our circus performance history. A community-driven
          archive dedicated to keeping our legacy alive for future generations.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/videos">
            <Button size="lg">Browse Videos</Button>
          </Link>
          <Link href="/submit">
            <Button variant="outline" size="lg">Submit a Video</Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="text-3xl mb-4">🎪</div>
          <h3 className="text-lg font-semibold text-gray-900">Preserve History</h3>
          <p className="mt-2 text-gray-600">
            Help us document and preserve performances from years past.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="text-3xl mb-4">🎬</div>
          <h3 className="text-lg font-semibold text-gray-900">Share Memories</h3>
          <p className="mt-2 text-gray-600">
            Submit YouTube links to performances you want to remember.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="text-3xl mb-4">🤝</div>
          <h3 className="text-lg font-semibold text-gray-900">Connect Community</h3>
          <p className="mt-2 text-gray-600">
            Reconnect with fellow performers through shared memories.
          </p>
        </div>
      </div>
    </div>
  );
}
