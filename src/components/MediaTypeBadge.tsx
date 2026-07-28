import { Headphones, Image as ImageIcon, Play } from "lucide-react";

const ICONS = {
  video: Play,
  audio: Headphones,
  image: ImageIcon,
} as const;

export type MediaBadgeType = keyof typeof ICONS;

/**
 * The Image | Audio | Video tag on a media card.
 *
 * Solid dark green so it stays readable over any cover photograph. On phones
 * the word collapses to keep the card uncluttered and the icon carries the
 * meaning — the label stays in the accessible name either way.
 */
export default function MediaTypeBadge({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) {
  const normalized = type.toLowerCase();
  const key: MediaBadgeType =
    normalized === "audio" ? "audio" : normalized === "image" ? "image" : "video";
  const Icon = ICONS[key];
  const label = key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <span className={`media-badge ${className}`}>
      <Icon size={13} aria-hidden="true" />
      <span className="media-badge__label">{label}</span>
    </span>
  );
}
