import { VideoUploader } from "./video-uploader";

export function PreviewPanel({
  videoUrl,
  projectId,
}: {
  videoUrl: string | null;
  projectId: string;
}) {
  return (
    <section className="flex-1 flex flex-col bg-black items-center justify-center relative p-8">
      <div className="aspect-video w-full max-w-4xl bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
        {videoUrl ? (
          <video src={videoUrl} controls className="w-full h-full" />
        ) : (
          <VideoUploader projectId={projectId} />
        )}
      </div>
    </section>
  );
}
