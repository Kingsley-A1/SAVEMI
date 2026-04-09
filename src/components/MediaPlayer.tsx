"use client";

interface MediaPlayerProps {
  src: string;
  type: string;
  title: string;
}

export default function MediaPlayer({ src, type, title }: MediaPlayerProps) {
  if (type === "video") {
    return (
      <video
        controls
        src={src}
        className="w-full rounded bg-black"
        aria-label={title}
        preload="metadata"
      />
    );
  }

  if (type === "audio") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-brand-primary text-sm font-medium">{title}</p>
        <audio
          controls
          src={src}
          className="w-full"
          aria-label={title}
          preload="metadata"
        />
      </div>
    );
  }

  if (type === "image") {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt={title} className="w-full rounded object-cover" />
    );
  }

  return null;
}
