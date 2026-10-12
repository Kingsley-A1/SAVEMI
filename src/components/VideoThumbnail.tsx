import Image from "next/image";
import { Play } from "lucide-react";

/**
 * The face of a video card: the chosen cover or the platform thumbnail when
 * there is one, otherwise a frame drawn from the video file itself. Fills its
 * (relative, sized) parent.
 */
export default function VideoThumbnail({
  imageUrl,
  videoUrl,
  sizes,
}: {
  imageUrl?: string | null;
  videoUrl?: string | null;
  sizes: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        fill
        quality={90}
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  if (videoUrl) {
    // `#t=1` makes the browser paint the frame one second in rather than a
    // black first frame; `preload="metadata"` keeps it to a small range read.
    return (
      <video
        src={`${videoUrl}#t=1`}
        preload="metadata"
        muted
        playsInline
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Play size={34} className="opacity-50" style={{ color: "#86efac" }} />
    </div>
  );
}
