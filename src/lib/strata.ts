import type { PostSummary, Tag } from "@/lib/data";

// 지층 하나를 그리는 데 필요한 글 정보. 본문·요약·카운터 없이 가볍게 가져온다.
export type BedSource = Pick<PostSummary, "slug" | "title" | "date" | "readTime" | "tags">;

// 색 슬롯: 태그 게시물 수 순위 상위 5개가 광물색을 받고, 나머지는 SLOT_OTHER(기타).
export const SLOT_COUNT = 5;
export const SLOT_OTHER = SLOT_COUNT;

// 제목이 붙는 큰 층의 수. 그보다 오래된 글은 압축된 얇은 박층(lamina)으로 쌓인다.
export const TITLED_BEDS = 8;

const SAMPLES = 40;
const LAMINA_SAMPLES = 10;
const MIN_BED_PX = 12;
const MIN_LAMINA_PX = 0.6;
const MID_SAMPLES = 48;
// 제목 기준선의 최대 기울기(약 0.5°). 접힘이 있어도 글자는 사실상 수평으로 놓인다.
const MAX_SLOPE = 0.009;
const LEGEND_GAP = 0.075;
const FIRST_TICK_MIN_Y = 0.04;
const TICK_GAP = 0.07;

// 지층 단면의 좌표계. SVG는 컨테이너와 같은 종횡비로 균등 스케일되어 무늬가 찌그러지지 않는다.
// 글자 크기는 사용자 단위라 SVG와 함께 스케일된다.
export interface Layout {
  w: number;
  h: number;
  // 전체 높이 중 압축된 박층 띠가 차지하는 비율.
  laminaShare: number;
  anticlineX: number;
  anticlineAmp: number;
  ripple: number;
  titleX: number;
  titleMax: number;
  titleFont: number;
  // 제목 중심선을 층 중심에서 위(-)/아래(+)로 옮기는 양. 두 줄 배치에서 제목을 위로 올린다.
  titleDy: number;
  dateX: number;
  dateDy: number;
  dateAnchor: "start" | "end";
}

// 데스크톱: 승인된 시안(2204x944)을 CSS px(1344 프레임)로 환산한 값.
export const WIDE_LAYOUT: Layout = {
  w: 1102,
  h: 472,
  laminaShare: 0.25,
  anticlineX: 0.53 * 1102,
  anticlineAmp: 14,
  ripple: 4,
  titleX: 0.043 * 1102,
  titleMax: 0.74 * 1102 - 0.043 * 1102,
  titleFont: 14,
  titleDy: 0,
  // 날짜는 제목 중심선보다 조금 아래에 놓아 시선이 제목에서 날짜로 내려앉게 한다.
  dateX: 1046,
  dateDy: 5,
  dateAnchor: "end",
};

// 모바일: 층마다 제목과 날짜를 두 줄로 쌓는다. 높이는 큰 층 수에 비례한다.
export function narrowLayout(titled: number): Layout {
  const laminae = 56;
  const h = titled * 58 + laminae;
  return {
    w: 346,
    h,
    laminaShare: laminae / h,
    anticlineX: 0.56 * 346,
    anticlineAmp: 8,
    ripple: 2,
    titleX: 14,
    titleMax: 346 - 28,
    titleFont: 14.5,
    titleDy: -9,
    dateX: 14,
    dateDy: 13,
    dateAnchor: "start",
  };
}

export interface Bed {
  slug: string;
  title: string;
  ymd: string;
  slot: number;
  // 같은 지층군 안에서 나오는 순서대로 명도를 0→1→2로 순환해서 퇴적 띠무늬를 만든다.
  tone: number;
  path: string;
  // 층 윗면 선. 밝은 가장자리 하이라이트로 쓴다.
  lip: string;
  topY: number;
  // 제목이 놓이는 기준선. 기울기를 거의 0으로 제한해서 글자가 수평으로 놓인다.
  midPath: string;
  label: string;
  dateX: number;
  dateY: number;
  dateAnchor: "start" | "end";
  rightY: number;
}

// 압축된 오래된 글. 제목 없이 지층색만 보이고, 마우스를 올리면 제목이 툴팁으로 나온다.
export interface Lamina {
  slug: string;
  title: string;
  ymd: string;
  // 기둥 전체 높이에서 이 층 중심의 위치(0~1). 고르기 컴포넌트가 마커를 찍는 데 쓴다.
  y: number;
  slot: number;
  tone: number;
  path: string;
  alpha: number;
}

export interface Tick {
  label: string;
  y: number;
}

export interface LegendItem {
  slot: number;
  label: string;
  y: number;
}

export interface Strata {
  beds: Bed[];
  laminae: Lamina[];
  // 박층 띠가 시작하는 높이(0~1).
  laminaTop: number;
  ticks: Tick[];
  legend: LegendItem[];
}

const KST = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 2026-05-18T01:59:06Z -> "2026.05.18" (KST 기준, 서버 시간대와 무관)
export function kstYmd(iso: string): string {
  return KST.format(new Date(iso)).replaceAll("-", ".");
}

// 태그 게시물 수 상위 5개에 슬롯을 준다. 동률이면 이름순.
export function rankSlots(tags: Tag[]): Map<string, number> {
  const ranked = [...tags].sort(
    (a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name),
  );
  return new Map(ranked.slice(0, SLOT_COUNT).map((t, i) => [t.slug, i]));
}

// 태그 slug -> 표시 이름과 슬롯. 목록의 태그 표시도 히어로와 같은 색 규칙을 쓴다.
export function tagInfoOf(tags: Tag[]): Record<string, { name: string; slot: number }> {
  const slots = rankSlots(tags);
  return Object.fromEntries(
    tags.map((t) => [t.slug, { name: t.name, slot: slots.get(t.slug) ?? SLOT_OTHER }]),
  );
}

// 층 두께는 읽기 시간이 길수록 두껍다(최대 ±25%). 편차가 더 크면 제목 줄 간격이
// 들쭉날쭉해져서 그 이상은 반영하지 않는다. read_time이 비었으면 7분(중간값)으로 본다.
function weightOf(readTime: string | null): number {
  const minutes = Number.parseInt(readTime ?? "", 10);
  const centered = ((Number.isFinite(minutes) ? minutes : 7) - 7) / 7;
  return 1 + 0.25 * Math.min(Math.max(centered, -1), 1);
}

// 모든 경계면이 같은 배사(anticline) 축과 같은 잔물결 위상을 공유해서 층이 평행하게 접힌다.
// 깊을수록 진폭이 줄어든다. 난수를 쓰지 않아서 같은 글 목록이면 항상 같은 모양이다.
function fold(x: number, depth: number, l: Layout): number {
  const bump = Math.exp(-(((x - l.anticlineX) / (0.17 * l.w)) ** 2));
  const anticline = -l.anticlineAmp * (1 - 0.75 * depth) * bump;
  const tilt = (x / l.w - 0.5) * 6 * (1 - depth);
  const ripple = l.ripple * Math.sin((x / l.w) * 2 * Math.PI * 1.6 + 0.8) * (1 - 0.5 * depth);
  return anticline + tilt + ripple;
}

const WIDE = /[ᄀ-ᇿ㄰-㆏가-힯　-鿿＀-￯]/;
const NARROW = /[ijlI.,:;'!| ()[\]-]/;

// 폰트 없이 어림한 글자 폭. 한글은 1em, 대문자 0.66em, 좁은 글자 0.32em, 나머지 0.56em.
function textUnits(text: string, size: number): number {
  let w = 0;
  for (const ch of text) {
    w += size * (WIDE.test(ch) ? 1 : NARROW.test(ch) ? 0.32 : /[A-Z]/.test(ch) ? 0.66 : 0.56);
  }
  return w;
}

// 층 폭에 맞게 말줄임. 전체 제목은 <title>과 aria-label로 남는다.
function fit(text: string, size: number, max: number): string {
  if (textUnits(text, size) <= max) return text;
  const chars = [...text];
  while (chars.length > 1 && textUnits(chars.join("") + "…", size) > max) chars.pop();
  return chars.join("").trimEnd() + "…";
}

// 등간격 표본 row에서 x 위치의 y를 보간한다.
function yAt(row: number[], x: number, w: number): number {
  const steps = row.length - 1;
  const f = (x / w) * steps;
  const i = Math.min(Math.floor(f), steps - 1);
  return row[i] + (row[i + 1] - row[i]) * (f - i);
}

export function buildStrata(posts: BedSource[], tags: Tag[], l: Layout): Strata {
  const n = posts.length;
  if (n === 0) return { beds: [], laminae: [], laminaTop: 1, ticks: [], legend: [] };

  const slots = rankSlots(tags);
  const tagName = new Map(tags.map((t) => [t.slug, t.name]));
  const titledN = Math.min(TITLED_BEDS, n);
  const lamN = n - titledN;
  const lamH = lamN > 0 ? l.h * l.laminaShare : 0;
  const bedH = l.h - lamH;

  // 큰 층은 읽기 시간에 비례하는 두께로 bedH를 채우고, 박층은 남은 높이를 균등하게 나눈다.
  const weights = posts.slice(0, titledN).map((p) => weightOf(p.readTime));
  const total = weights.reduce((a, b) => a + b, 0);
  const base: number[] = [0];
  for (let k = 0; k < n; k++) {
    const t = k < titledN ? (weights[k] / total) * bedH : lamH / lamN;
    base.push(base[k] + t);
  }

  // 경계면 k의 y 표본. 큰 층 경계는 촘촘하게, 박층 경계는 성기게 표본을 잡고
  // 아래 경계가 위 경계보다 최소 두께만큼 아래에 있게 보정한다.
  const boundaries: number[][] = [];
  for (let k = 0; k <= n; k++) {
    const steps = k <= titledN ? SAMPLES : LAMINA_SAMPLES;
    const minPx = k <= titledN ? MIN_BED_PX : MIN_LAMINA_PX;
    const row: number[] = [];
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * l.w;
      let y = base[k] + fold(x, k / n, l);
      if (k > 0) y = Math.max(y, yAt(boundaries[k - 1], x, l.w) + minPx);
      row.push(y);
    }
    boundaries.push(row);
  }

  const at = (k: number, x: number) => yAt(boundaries[k], x, l.w);
  const fmt = (v: number) => v.toFixed(1);
  const pointsOf = (row: number[]) =>
    row.map((y, s) => `${fmt((s / (row.length - 1)) * l.w)} ${fmt(y)}`);

  const occurrence = new Array(SLOT_COUNT + 1).fill(0);
  const slotOf = (post: BedSource) => slots.get(post.tags[0] ?? "") ?? SLOT_OTHER;

  const beds: Bed[] = posts.slice(0, titledN).map((post, k) => {
    const top = pointsOf(boundaries[k]);
    const bottom = pointsOf(boundaries[k + 1]).reverse();
    const slot = slotOf(post);
    const tone = occurrence[slot] % 3;
    occurrence[slot] += 1;
    const midY = (x: number) => (at(k, x) + at(k + 1, x)) / 2;
    const label = fit(post.title, l.titleFont, l.titleMax);
    const reach = Math.min(l.titleX + textUnits(label, l.titleFont) + 24, l.titleX + l.titleMax + 24);
    // 중심선을 최소제곱 직선으로 근사하고 기울기를 거의 0으로 제한한다.
    const pts = Array.from({ length: MID_SAMPLES + 1 }, (_, i) => {
      const x = l.titleX + ((reach - l.titleX) * i) / MID_SAMPLES;
      return [x, midY(x)] as const;
    });
    const mx = pts.reduce((a, [x]) => a + x, 0) / pts.length;
    const my = pts.reduce((a, [, y]) => a + y, 0) / pts.length;
    const sxx = pts.reduce((a, [x]) => a + (x - mx) ** 2, 0);
    const sxy = pts.reduce((a, [x, y]) => a + (x - mx) * (y - my), 0);
    const slope = Math.min(Math.max(sxx > 0 ? sxy / sxx : 0, -MAX_SLOPE), MAX_SLOPE);
    const lineY = (x: number) => my + slope * (x - mx) + l.titleDy;
    return {
      slug: post.slug,
      title: post.title,
      ymd: kstYmd(post.date),
      slot,
      tone,
      path: `M${top.join(" L")} L${bottom.join(" L")} Z`,
      lip: `M${top.join(" L")}`,
      topY: boundaries[k][0] / l.h,
      midPath: `M${fmt(l.titleX)} ${fmt(lineY(l.titleX))} L${fmt(reach)} ${fmt(lineY(reach))}`,
      label,
      dateX: l.dateX,
      dateY: midY(l.dateX) + l.dateDy,
      dateAnchor: l.dateAnchor,
      rightY: midY(0.94 * l.w) / l.h,
    };
  });

  // 박층: 깊을수록 그림자 속으로 옅어진다.
  const laminae: Lamina[] = posts.slice(titledN).map((post, j) => {
    const k = titledN + j;
    const slot = slotOf(post);
    const tone = occurrence[slot] % 3;
    occurrence[slot] += 1;
    return {
      slug: post.slug,
      title: post.title,
      ymd: kstYmd(post.date),
      y: (at(k, 0.5 * l.w) + at(k + 1, 0.5 * l.w)) / 2 / l.h,
      slot,
      tone,
      path: `M${pointsOf(boundaries[k]).join(" L")} L${pointsOf(boundaries[k + 1]).reverse().join(" L")} Z`,
      alpha: 0.95 - 0.5 * (j / Math.max(lamN - 1, 1)),
    };
  });

  // 깊이 눈금: 월이 바뀌는 첫 층의 윗면에 라벨을 달고, 라벨끼리는 최소 간격을 둔다.
  const ticks: Tick[] = [];
  let lastMonth = "";
  let lastY = -1;
  posts.forEach((post, k) => {
    const month = kstYmd(post.date).slice(0, 7);
    const y = Math.max(at(k, 0) / l.h, FIRST_TICK_MIN_Y);
    if (month !== lastMonth && (lastY < 0 || y - lastY >= TICK_GAP)) {
      ticks.push({ label: month, y });
      lastY = y;
    }
    lastMonth = month;
  });

  // 범례: 기둥에 나온 모든 지층군(기타 포함)을 처음 나오는 층의 높이에 붙이고, 겹치면 밀어서 벌린다.
  const nameOfSlot = new Map([...slots].map(([slug, slot]) => [slot, slug]));
  const firstY = new Map<number, number>();
  posts.forEach((post, k) => {
    const slot = slotOf(post);
    if (!firstY.has(slot)) firstY.set(slot, (at(k, 0.94 * l.w) + at(k + 1, 0.94 * l.w)) / 2 / l.h);
  });
  const legend: LegendItem[] = [...firstY]
    .map(([slot, y]) => ({
      slot,
      y,
      label: slot === SLOT_OTHER ? "기타" : (tagName.get(nameOfSlot.get(slot) ?? "") ?? ""),
    }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < legend.length; i++) {
    legend[i].y = Math.max(legend[i].y, legend[i - 1].y + LEGEND_GAP);
  }
  // 아래로 밀려 기둥 밖으로 나간 항목은 위로 되돌려 넣는다.
  for (let i = legend.length - 1; i >= 0; i--) {
    const limit = i === legend.length - 1 ? 0.97 : legend[i + 1].y - LEGEND_GAP;
    legend[i].y = Math.min(legend[i].y, limit);
  }

  return { beds, laminae, laminaTop: bedH / l.h, ticks, legend };
}
