import { notFound } from 'next/navigation';
import Link from 'next/link';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { Button } from '@/components/ui/Button';

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

// TODO: Fetch from database
async function getVideo(id: string) {
  // Placeholder - will be replaced with actual database query
  return null;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/videos">
        <Button variant="ghost" className="mb-4">
          &larr; Back to Videos
        </Button>
      </Link>

      {/* Placeholder content until database is connected */}
      <div className="text-center py-12">
        <p className="text-gray-500">Video not found. Connect the database to view videos.</p>
      </div>
    </div>
  );
}
