import Link from "next/link";
import { LaminaPicker } from "@/components/lamina-picker";
import type { Tag } from "@/lib/data";
import {
  TITLED_BEDS,
  WIDE_LAYOUT,
  buildStrata,
  narrowLayout,
  type Bed,
  type BedSource,
  type Lamina,
  type Layout,
  type LegendItem,
} from "@/lib/strata";

// 층 재질: 승인된 시안의 깨끗한 층 조각을 거울 타일링한 질감 플레이트(public/assets/plates/bed-*.webp).
// 같은 지층군의 두 번째 층은 변형 무늬(TEX_ALT)를 쓰고, 세 번째 층은 CSS 필터로 한 단계 어둡게 하고 대비를 높인다.
// 값은 타일의 CSS 크기(px/2)다. 빗금과 대시는 주기에 맞춰 잘라 이음매가 없고, 나머지는 2x2 거울 타일이다.
const TEX: Record<string, [number, number]> = {
  "0-0": [200, 44],
  "0-1": [200, 44],
  "1-0": [200, 44],
  "1-1": [43.5, 12],
  "2-0": [40.5, 15],
  "2-1": [200, 44],
  "3-0": [57.5, 12],
  "4-0": [200, 44],
  "5-0": [200, 44],
};
const TEX_ALT = ["0-1", "1-1", "2-1", "3-0", "4-0", "5-0"];
const TEX_BASE = ["0-0", "1-0", "2-0", "3-0", "4-0", "5-0"];

// 질감이 로드되기 전과 실패했을 때 보이는 바탕색(질감의 평균색).
const SLOT_BG = ["#9a6d2e", "#33797a", "#9a5339", "#575989", "#d8d7c7", "#76848e"];

function Swatch({ slot }: { slot: number }) {
  return (
    <svg className="legend-swatch" viewBox="0 0 16 18" aria-hidden="true">
      <rect width="16" height="18" fill={SLOT_BG[slot]} />
      <rect width="16" height="18" fill={`url(#tex-${TEX_BASE[slot]})`} />
    </svg>
  );
}

function LegendRow({ item }: { item: LegendItem }) {
  return (
    <li className="legend-item" style={{ top: `${item.y * 100}%` }}>
      <span className="legend-leader" aria-hidden="true" />
      <Swatch slot={item.slot} />
      <span className="legend-label">{item.label}</span>
    </li>
  );
}

function BedList({
  beds,
  laminae,
  laminaTop,
  layout,
  id,
  className,
}: {
  beds: Bed[];
  laminae: Lamina[];
  laminaTop: number;
  layout: Layout;
  id: string;
  className: string;
}) {
  return (
    <ol
      className={className}
      aria-label={`최신 글 ${beds.length}편`}
      style={{ aspectRatio: `${layout.w} / ${layout.h}` }}
    >
      {laminae.length > 0 && (
        <li
          className="bed-item"
          style={{ "--i": beds.length, "--n": beds.length } as React.CSSProperties}
          aria-hidden="true"
        >
          <div className="bed">
            <svg viewBox={`0 0 ${layout.w} ${layout.h}`} preserveAspectRatio="none" focusable="false">
              {laminae.map((lamina) => (
                <path
                  key={lamina.slug}
                  className="lamina"
                  d={lamina.path}
                  fill={SLOT_BG[lamina.slot]}
                  opacity={lamina.alpha * (lamina.tone === 1 ? 0.9 : lamina.tone === 2 ? 0.8 : 1)}
                >
                  <title>{lamina.title}</title>
                </path>
              ))}
            </svg>
          </div>
        </li>
      )}
      {beds.map((bed, i) => (
        <li
          key={bed.slug}
          className={`bed-item f${bed.slot}`}
          style={{ "--i": i, "--n": beds.length } as React.CSSProperties}
        >
          <Link
            href={`/posts/${bed.slug}`}
            className="bed"
            data-tone={bed.tone}
            aria-label={`${bed.title}, ${bed.ymd}`}
          >
            <svg
              viewBox={`0 0 ${layout.w} ${layout.h}`}
              preserveAspectRatio="none"
              focusable="false"
            >
              <title>{bed.title}</title>
              <path id={`${id}-mid-${i}`} d={bed.midPath} fill="none" />
              <g className="shape">
                <path className="base" d={bed.path} />
                <path
                  className="tex"
                  d={bed.path}
                  fill={`url(#tex-${bed.tone === 1 ? TEX_ALT[bed.slot] : TEX_BASE[bed.slot]})`}
                />
                <path className="edge" d={bed.path} />
                <path className="lip" d={bed.lip} />
                <text className="bed-title">
                  <textPath href={`#${id}-mid-${i}`}>{bed.label}</textPath>
                </text>
                <text className="bed-date" x={bed.dateX} y={bed.dateY} textAnchor={bed.dateAnchor}>
                  {bed.ymd}
                </text>
              </g>
            </svg>
          </Link>
        </li>
      ))}
      {laminae.length > 0 && (
        <li className="lamina-slot">
          <LaminaPicker items={laminae} top={laminaTop} />
        </li>
      )}
    </ol>
  );
}

export function StrataHero({
  posts,
  tags,
}: {
  // 최신순으로 정렬된 발행 글 전체. 앞 TITLED_BEDS편은 큰 층, 나머지는 압축된 박층이 된다.
  posts: BedSource[];
  tags: Tag[];
}) {
  const wide = buildStrata(posts, tags, WIDE_LAYOUT);
  const narrowL = narrowLayout(Math.min(TITLED_BEDS, posts.length));
  const narrow = buildStrata(posts, tags, narrowL);
  const latest = posts[0];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <svg className="hero-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          {Object.entries(TEX).map(([t, [w, h]]) => (
            <pattern key={t} id={`tex-${t}`} width={w} height={h} patternUnits="userSpaceOnUse">
              <image href={`/assets/plates/bed-${t}.webp`} width={w} height={h} preserveAspectRatio="none" />
            </pattern>
          ))}
        </defs>
      </svg>

      <h1 id="hero-title" className="hero-title">
        개발하며 배운 것을
        <br />
        쌓아두는 블로그
      </h1>
      {latest && (
        <Link href={`/posts/${latest.slug}`} className="hero-cta">
          최신 글 읽기
        </Link>
      )}

      <div className="hero-surface" aria-hidden="true" />

      <div className="depth-ruler" aria-hidden="true">
        {wide.beds.map((bed) => (
          <span key={bed.slug} className="depth-minor" style={{ top: `${bed.topY * 100}%` }} />
        ))}
        {wide.ticks.map((t) => (
          <span key={t.label} className="depth-tick" style={{ top: `${t.y * 100}%` }}>
            {t.label}
          </span>
        ))}
      </div>

      <BedList
        beds={wide.beds}
        laminae={wide.laminae}
        laminaTop={wide.laminaTop}
        layout={WIDE_LAYOUT}
        id="wide"
        className="strata strata-wide"
      />
      <BedList
        beds={narrow.beds}
        laminae={narrow.laminae}
        laminaTop={narrow.laminaTop}
        layout={narrowL}
        id="narrow"
        className="strata strata-narrow"
      />

      <ul className="legend" aria-hidden="true">
        {wide.legend.map((item) => (
          <LegendRow key={item.slot} item={item} />
        ))}
      </ul>
    </section>
  );
}
