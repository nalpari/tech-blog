// 어긋난 세 층을 쌓은 마크와 techlog 워드마크. 헤더와 푸터가 함께 쓴다.
// compact는 푸터용 고정 크기, 기본은 모바일에서 한 단계 작아진다.
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`inline-flex items-center ${compact ? "gap-2" : "gap-2 sm:gap-2.5"}`}>
      <svg
        className={compact ? "w-[17px] h-[14px]" : "w-[18px] h-[14px] sm:w-[22px] sm:h-[18px]"}
        viewBox="0 0 22 18"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="22" height="4" />
        <rect x="5" y="7" width="17" height="4" />
        <rect x="2" y="14" width="14" height="4" />
      </svg>
      <span
        className={`${compact ? "text-base" : "text-[18px] sm:text-[22px]"} font-extrabold tracking-[-0.03em] leading-none`}
      >
        techlog
      </span>
    </span>
  );
}
