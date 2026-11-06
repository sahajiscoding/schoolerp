import { Link, useSearchParams } from "react-router-dom";
import { useAppData as useData } from "../lib/appData";
import { Card } from "../components/ui";

/** Report-parity `/school-gallery?page=1` — albums + galleries. */
export default function SchoolGallery() {
  const data = useData();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ink dark:text-white">School Gallery</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.gallery.map((album) => (
          <Link key={album.id} to={`/school-gallery/${album.id}/${album.photos[0] ?? ""}`}>
            <Card className="overflow-hidden">
              <div className="flex h-32 items-center justify-center bg-slate-100 dark:bg-slate-700">
                <span className="text-sm text-muted">{album.photos.length} photos</span>
              </div>
              <div className="pt-3">
                <div className="font-semibold text-ink dark:text-white">{album.title}</div>
                <div className="text-xs text-muted line-clamp-2">{album.description}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {data.gallery.length === 0 && <p className="text-sm text-muted">No albums yet.</p>}
      <div className="text-xs text-muted">
        Page {page} ·{" "}
        <Link className="underline" to={`/school-gallery?page=${page + 1}`}>
          Next →
        </Link>
      </div>
    </div>
  );
}
