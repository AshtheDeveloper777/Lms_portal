'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, CheckCircle2, Maximize, AlertCircle } from 'lucide-react';

type VideoPlayerProps = {
  url: string | null | undefined;
  title?: string;
  isCompleted?: boolean;
  onComplete?: () => void;
};

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] ?? null;
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? (match[1] ?? null) : null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export default function VideoPlayer({
  url,
  title = 'Lesson Video',
  isCompleted = false,
  onComplete,
}: VideoPlayerProps) {
  const [isTheater, setIsTheater] = useState(false);
  const [hasCompletedTriggered, setHasCompletedTriggered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const youtubeId = url ? getYouTubeId(url) : null;
  const vimeoId = url ? getVimeoId(url) : null;
  const direct = url ? isDirectVideo(url) : false;

  useEffect(() => {
    setHasCompletedTriggered(false);
  }, [url]);

  const handleVideoCompleted = () => {
    if (!hasCompletedTriggered) {
      setHasCompletedTriggered(true);
      if (onComplete) {
        onComplete();
      }
    }
  };

  useEffect(() => {
    if (!youtubeId) return;

    function handleMessage(event: MessageEvent) {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (data && (data.info === 0 || (data.event === 'onStateChange' && data.info === 0))) {
          handleVideoCompleted();
        }
      } catch {}
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [youtubeId, hasCompletedTriggered, onComplete]);

  if (!url) {
    return (
      <div
        className='lms-video-placeholder'
        style={{
          aspectRatio: '16/9',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--text-muted)',
            }}
          >
            <AlertCircle size={28} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            No video added for this lesson
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            The instructor hasn&apos;t attached a video link yet. Read the lesson notes below.
          </p>
        </div>
      </div>
    );
  }

  const ytSrc = youtubeId ? 'https://www.youtube.com/embed/' + youtubeId + '?enablejsapi=1&rel=0&modestbranding=1&autoplay=0' : '';
  const vimeoSrc = vimeoId ? 'https://player.vimeo.com/video/' + vimeoId + '?badge=0&autopause=0' : '';

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: isTheater ? '100%' : '100%',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        background: '#000000',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
        {youtubeId && (
          <iframe
            src={ytSrc}
            title={title}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        )}

        {vimeoId && (
          <iframe
            src={vimeoSrc}
            title={title}
            allow='autoplay; fullscreen; picture-in-picture'
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        )}

        {direct && (
          <video
            src={url}
            controls
            title={title}
            onEnded={handleVideoCompleted}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration && v.currentTime / v.duration >= 0.95) {
                handleVideoCompleted();
              }
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#000000',
            }}
          >
            Your browser does not support the video tag.
          </video>
        )}

        {!youtubeId && !vimeoId && !direct && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              padding: 24,
            }}
          >
            <Play size={40} style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Watch Lesson Video</p>
            <a
              href={url}
              target='_blank'
              rel='noopener noreferrer'
              className='lms-btn lms-btn--primary'
              style={{ fontSize: 13 }}
            >
              Open External Video
            </a>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          fontSize: 13,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isCompleted ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: 'var(--green)',
                fontWeight: 600,
                fontSize: 12,
                background: 'var(--green-bg)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--green-border)',
              }}
            >
              <CheckCircle2 size={13} /> Completed
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Watching will automatically mark this lesson completed when finished.
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isCompleted && (
            <button
              onClick={handleVideoCompleted}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                padding: '4px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              title='Click if you have already watched this video elsewhere'
            >
              Mark as watched
            </button>
          )}

          <button
            onClick={() => setIsTheater(!isTheater)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'none',
              border: 'none',
              color: isTheater ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
            title={isTheater ? 'Exit theater mode' : 'Theater mode'}
          >
            <Maximize size={14} />
            {isTheater ? 'Default' : 'Theater'}
          </button>
        </div>
      </div>
    </div>
  );
}
