"use client";

import { useMemo } from "react";

interface Props {
  /** youtube id, full youtube URL, or direct video URL */
  source: string | null;
  title?: string;
}

/** ดึง youtube id จาก url หลายรูปแบบ */
function extractYouTubeId(input: string): string | null {
  // ถ้า input เป็น id เปล่า (11 ตัว alphanumeric/dash)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      // /embed/{id} หรือ /shorts/{id}
      const m = url.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function VideoPlayer({ source, title }: Props) {
  const embed = useMemo(() => {
    if (!source) return null;
    const yt = extractYouTubeId(source);
    if (yt) {
      return {
        kind: "iframe" as const,
        src: `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`,
      };
    }
    if (source.startsWith("http") || source.startsWith("/")) {
      return { kind: "video" as const, src: source };
    }
    return null;
  }, [source]);

  if (!embed) {
    return (
      <div className="grid aspect-video place-items-center rounded-[var(--radius)] bg-muted text-sm text-muted-foreground">
        ยังไม่มีวิดีโอสำหรับบทเรียนนี้
      </div>
    );
  }

  if (embed.kind === "iframe") {
    return (
      <div className="aspect-video overflow-hidden rounded-[var(--radius)] bg-black">
        <iframe
          src={embed.src}
          title={title || "video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  return (
    <video
      src={embed.src}
      controls
      className="aspect-video w-full rounded-[var(--radius)] bg-black"
    />
  );
}
