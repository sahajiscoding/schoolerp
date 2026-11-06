import { Link, useParams } from "react-router-dom";
import { useAppData as useData } from "../lib/appData";
import { Card } from "../components/ui";

/** Report-parity `/school-gallery/:albumId/:mediaId` — high-res album viewer. */
export default function SchoolGalleryViewer() {
  const { albumId, mediaId } = useParams<{ albumId: string; mediaId: string }>();
  const data = useData();
  const album = data.gallery.find((a) => a.id === albumId);
  const index = album?.photos.indexOf(mediaId ?? "") ?? -1;

  if (!album) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Album not found.</p>
        <Link to="/school-gallery" className="text-sm text-navy underline dark:text-blue-300">
          Back to gallery
        </Link>
      </div>
    );
  }

  const prev = index > 0 ? album.photos[index - 1] : null;
  const next = index >= 0 && index < album.photos.length - 1 ? album.photos[index + 1] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/school-gallery" className="text-xs text-muted hover:text-navy dark:hover:text-blue-300">
        ← Back to gallery
      </Link>
      <h2 className="text-xl font-bold text-ink dark:text-white">{album.title}</h2>
      <Card className="flex h-80 items-center justify-center bg-slate-100 dark:bg-slate-700">
        <span className="text-sm text-muted">Photo {index + 1} of {album.photos.length} · {mediaId}</span>
      </Card>
      <div className="flex items-center gap-2 text-xs">
        {prev && (
          <Link className="rounded-lg border border-slate-300 px-3 py-1 dark:border-slate-700" to={`/school-gallery/${album.id}/${prev}`}>
            ← Prev
          </Link>
        )}
        {next && (
          <Link className="rounded-lg border border-slate-300 px-3 py-1 dark:border-slate-700" to={`/school-gallery/${album.id}/${next}`}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
