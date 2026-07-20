import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import ePub, { type Book, type Location, type NavItem, type Rendition } from 'epubjs';
import type { EpubLocator } from '../../types/api';

export type EpubFlow = 'PAGE' | 'SCROLL';
export type EpubLoadingPhase = 'parsing' | 'locations' | 'rendering' | 'ready';

export type EpubRendererHandle = {
  display: (target?: string | number) => Promise<void>;
  displayProgression: (progression: number) => Promise<void>;
  first: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
};

type EpubRendererProps = {
  data: ArrayBuffer;
  initialLocator: EpubLocator | null;
  epubVersion: number;
  fontSizePercent: number;
  flow: EpubFlow;
  onError: (error: Error) => void;
  onLocationChange: (locator: EpubLocator, atStart: boolean, atEnd: boolean) => void;
  onPhaseChange: (phase: EpubLoadingPhase) => void;
  onTocChange: (items: NavItem[]) => void;
};

function clampProgression(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

async function displayInitialLocation(rendition: Rendition, book: Book, locator: EpubLocator | null) {
  const targets: Array<string | number | undefined> = [];
  if (locator?.cfi) targets.push(locator.cfi);
  if (locator?.chapterHref) targets.push(locator.chapterHref);
  if (typeof locator?.spineIndex === 'number') targets.push(locator.spineIndex);
  targets.push(book.spine.first()?.href, undefined);

  for (const target of targets) {
    try {
      if (typeof target === 'number') await rendition.display(target);
      else await rendition.display(target);
      return;
    } catch {
      // 손상되거나 교체된 locator이면 다음 fallback 위치를 시도한다.
    }
  }
  throw new Error('EPUB의 시작 위치를 열지 못했습니다.');
}

export const EpubRenderer = forwardRef<EpubRendererHandle, EpubRendererProps>(function EpubRenderer(
  { data, initialLocator, epubVersion, fontSizePercent, flow, onError, onLocationChange, onPhaseChange, onTocChange },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const locatorRef = useRef<EpubLocator | null>(initialLocator);

  useImperativeHandle(ref, () => ({
    async display(target) {
      const rendition = renditionRef.current;
      if (!rendition) return;
      if (typeof target === 'number') await rendition.display(target);
      else await rendition.display(target);
    },
    async displayProgression(progression) {
      const book = bookRef.current;
      const rendition = renditionRef.current;
      if (!book || !rendition || book.locations.length() === 0) return;
      const cfi = book.locations.cfiFromPercentage(clampProgression(progression));
      if (cfi) await rendition.display(cfi);
    },
    async first() {
      const book = bookRef.current;
      const rendition = renditionRef.current;
      if (book && rendition) await rendition.display(book.spine.first()?.href);
    },
    async next() {
      await renditionRef.current?.next();
    },
    async prev() {
      await renditionRef.current?.prev();
    },
  }), []);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSizePercent}%`);
  }, [fontSizePercent]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const currentCfi = locatorRef.current?.cfi;
    rendition.flow(flow === 'PAGE' ? 'paginated' : 'scrolled-doc');
    if (currentCfi) void rendition.display(currentCfi);
  }, [flow]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderHost = host;

    let disposed = false;
    let book: Book | null = null;
    let rendition: Rendition | null = null;

    const handleRelocated = (location: Location) => {
      if (disposed || !book || !location?.start?.cfi) return;
      let progression = location.start.percentage;
      if (!Number.isFinite(progression) && book.locations.length() > 0) {
        progression = book.locations.percentageFromCfi(location.start.cfi);
      }
      const section = book.spine.get(location.start.href);
      const locator: EpubLocator = {
        epubVersion,
        cfi: location.start.cfi,
        chapterHref: location.start.href,
        spineIndex: section?.index ?? location.start.index,
        progression: clampProgression(location.atEnd ? 1 : progression),
      };
      locatorRef.current = locator;
      onLocationChange(locator, location.atStart === true, location.atEnd === true);
    };

    async function initialize() {
      try {
        onPhaseChange('parsing');
        renderHost.replaceChildren();
        book = ePub(data);
        bookRef.current = book;
        rendition = book.renderTo(renderHost, {
          width: '100%',
          height: '100%',
          flow: flow === 'PAGE' ? 'paginated' : 'scrolled-doc',
          spread: 'none',
          resizeOnOrientationChange: true,
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;
        rendition.on('relocated', handleRelocated);

        await book.ready;
        if (disposed) return;
        const navigation = await book.loaded.navigation;
        if (!disposed) onTocChange(navigation.toc ?? []);

        onPhaseChange('locations');
        try {
          await book.locations.generate(1600);
        } catch {
          // locations 생성 실패 시에도 chapter 단위 prev/next와 CFI 이어보기는 제공한다.
        }
        if (disposed) return;

        onPhaseChange('rendering');
        rendition.themes.default({
          body: {
            color: '#1f2937',
            'font-family': "'Noto Sans KR', sans-serif",
            'line-height': '1.8',
            padding: '0 1rem',
          },
          img: { 'max-width': '100%', height: 'auto' },
        });
        rendition.themes.fontSize(`${fontSizePercent}%`);
        await displayInitialLocation(rendition, book, initialLocator);
        if (!disposed) onPhaseChange('ready');
      } catch (error) {
        if (!disposed) onError(error instanceof Error ? error : new Error('EPUB을 렌더링하지 못했습니다.'));
      }
    }

    void initialize();

    return () => {
      disposed = true;
      if (rendition) {
        rendition.off('relocated', handleRelocated);
        try {
          rendition.destroy();
        } catch {
          // StrictMode의 중복 cleanup에서도 안전하게 종료한다.
        }
      }
      if (book) {
        try {
          book.destroy();
        } catch {
          // rendition이 먼저 archive를 정리한 경우의 중복 destroy를 무시한다.
        }
      }
      bookRef.current = null;
      renditionRef.current = null;
      renderHost.replaceChildren();
    };
    // data가 바뀔 때만 EPUB 객체를 다시 생성한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return <div ref={hostRef} className="epub-renderer-host" aria-label="EPUB 본문" />;
});
