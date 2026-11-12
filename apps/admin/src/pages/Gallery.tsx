import { useGalleryData } from '../lib/useGalleryData';
import {
  Card,
} from '../components/ui';
import { FiImage, FiFolder } from 'react-icons/fi';

export default function Gallery() {
  const data = useGalleryData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">School Gallery</h1>
          <p className="text-muted">
            A glimpse of everyday learning at Pacific World School.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.albums.map((album) => (
          <Card key={album.id} className="h-full cursor-pointer">
            <div className="relative h-48 overflow-hidden rounded-lg bg-sand mb-3">
              <img
                src={album.cover}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-base font-bold text-ink">{album.title}</h3>
            <p className="text-sm text-muted">{album.description}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted">
              <FiFolder size={14} />
              <span>{album.photos.length} photos</span>
            </div>
          </Card>
        ))}
        {data.albums.length === 0 && (
          <div className="grid-cols-1 col-span-full">
            <Card className="text-center py-12">
              <FiImage size={32} className="mx-auto mb-3 text-slate-400" />
              <div className="text-muted text-sm">No gallery albums yet.</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
