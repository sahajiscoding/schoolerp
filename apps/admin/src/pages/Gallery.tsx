import { useAppData } from '../lib/appData';
import {
  Card,
} from '../components/ui';
import { EmptyState, Page, PageHeader } from '../components/page';
import { FiImage, FiFolder } from 'react-icons/fi';

export default function Gallery() {
  const data = useAppData();

  return (
    <Page>
      <PageHeader eyebrow="School chronicle" title="School Gallery" description="A glimpse of everyday learning at Pacific World School." />

      <section aria-label="School memories" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.gallery.map((album) => (
          <Card key={album.id} className="h-full overflow-hidden" padded={false}>
            <div className="relative h-52 overflow-hidden bg-parchment">
              <img
                src={album.cover}
                alt={album.title}
                className="h-full w-full object-cover"
                width="640"
                height="420"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-forest-950/65 to-transparent" aria-hidden="true" />
            </div>
            <div className="p-5">
              <h2 className="font-display text-2xl font-medium text-ink">{album.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{album.description}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-moss">
                <FiFolder size={14} aria-hidden="true" />
                <span>{album.photos.length} photos</span>
              </div>
            </div>
          </Card>
        ))}
        {data.gallery.length === 0 && (
          <div className="col-span-full">
            <EmptyState title="No gallery albums yet" description="School memories will appear here when they are available." icon={FiImage} />
          </div>
        )}
      </section>
    </Page>
  );
}
