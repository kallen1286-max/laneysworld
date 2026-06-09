import { useState } from 'react';
import { trackEvent } from '../utils/analytics';

interface LiteYouTubeProps {
  videoId: string;
  title: string;
  /** Tailwind height classes, e.g. "h-[200px] sm:h-[240px] lg:h-[280px]" */
  heightClass?: string;
}

/**
 * Performance-optimised YouTube embed.
 * Renders a thumbnail + play button on first paint; injects the real
 * <iframe autoplay> only when the user clicks, eliminating ~500 KB of
 * YouTube JS/CSS from the initial page load.
 */
export function LiteYouTube({ videoId, title, heightClass = 'h-[200px] sm:h-[240px] lg:h-[280px]' }: LiteYouTubeProps) {
  const [activated, setActivated] = useState(false);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  // maxresdefault is 1280×720; hqdefault (480×360) is the universal fallback
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  if (activated) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        className={`w-full ${heightClass}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className={`relative w-full bg-black overflow-hidden cursor-pointer group rounded-xl sm:rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${heightClass}`}
      onClick={() => {
        trackEvent('video_play', { video_id: videoId, video_title: title });
        setActivated(true);
      }}
      aria-label={`Play video: ${title}`}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          // Fall back to hqdefault if maxresdefault doesn't exist
          (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />

      {/* YouTube-style play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-red-500 transition-all duration-300"
          aria-hidden="true"
        >
          <svg
            className="w-7 h-7 sm:w-9 sm:h-9 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* "Click to play" hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs sm:text-sm px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        Click to play
      </div>
    </button>
  );
}
