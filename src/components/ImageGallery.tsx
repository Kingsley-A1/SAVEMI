"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Image as ImageIcon, X } from "lucide-react";

export interface GalleryImage {
  id: string;
  slug: string;
  title: string;
  /** Grid tile — the cover when one was set, else the image itself. */
  src: string | null;
  /** The original image, shown in the viewer. */
  fullSrc?: string | null;
}

/**
 * Image grid that opens into a full-screen viewer. The viewer is a native
 * horizontal scroll-snap track, so a swipe on a phone or trackpad moves one
 * image at a time with the platform's own momentum; arrows and the keyboard
 * do the same on desktop. The browser Back button closes it.
 */
export default function ImageGallery({ images }: { images: GalleryImage[] }) {
  const viewable = images.filter((image): image is GalleryImage & { src: string } =>
    Boolean(image.src),
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const isOpen = openIndex !== null;

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  const open = (index: number) => {
    setOpenIndex(index);
    setCurrent(index);
    window.history.pushState({ savemiGallery: true }, "");
  };

  // Closing goes through history so Back and the close button agree.
  const close = useCallback(() => {
    if (window.history.state?.savemiGallery) {
      window.history.back();
    } else {
      setOpenIndex(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    scrollToIndex(openIndex, false);

    const onPopState = () => setOpenIndex(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    const step = (delta: number) => {
      const track = trackRef.current;
      if (!track) return;
      const index = Math.round(track.scrollLeft / track.clientWidth) + delta;
      scrollToIndex(Math.max(0, Math.min(viewable.length - 1, index)));
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", onKey);
    };
    // openIndex only seeds the first position; scrolling owns it afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  };

  const active = viewable[current];

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {images.map((image) => {
          const viewIndex = viewable.findIndex((item) => item.id === image.id);
          return (
            <li key={image.id}>
              {image.src ? (
                <button
                  type="button"
                  onClick={() => open(viewIndex)}
                  className="media-tile group relative aspect-[4/5] w-full"
                  aria-label={`View ${image.title}`}
                >
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    quality={90}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ) : (
                <Link
                  href={`/messages/${image.slug}`}
                  className="media-tile flex aspect-[4/5] w-full items-center justify-center"
                  style={{ background: "var(--brand-primary-deep)" }}
                  aria-label={image.title}
                >
                  <ImageIcon size={30} style={{ color: "#86efac" }} />
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div className="flex items-center gap-3 px-3 py-2 text-white">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {active?.title}
            </p>
            <span className="shrink-0 text-xs text-white/60 tabular-nums">
              {current + 1} / {viewable.length}
            </span>
            {active ? (
              <Link
                href={`/messages/${active.slug}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Open details, download, and share"
                title="Details"
              >
                <ExternalLink size={18} />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={trackRef}
            onScroll={onScroll}
            className="flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {viewable.map((image, index) => (
              <div
                key={image.id}
                className="relative h-full w-full shrink-0 snap-center snap-always"
              >
                <Image
                  src={image.fullSrc ?? image.src}
                  alt={image.title}
                  fill
                  quality={90}
                  sizes="100vw"
                  // Neighbours load early so a swipe never lands on a blank.
                  loading={Math.abs(index - current) <= 1 ? "eager" : "lazy"}
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {current > 0 ? (
            <button
              type="button"
              onClick={() => scrollToIndex(current - 1)}
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>
          ) : null}
          {current < viewable.length - 1 ? (
            <button
              type="button"
              onClick={() => scrollToIndex(current + 1)}
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
