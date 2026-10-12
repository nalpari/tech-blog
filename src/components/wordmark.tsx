// techlog 텍스트 워드마크. 헤더와 푸터가 함께 쓰며 색은 부모에서 상속한다.
// compact는 푸터용으로 한 단계 작은 고정 크기, 기본은 sm 이상에서 한 단계 커진다.
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`${compact ? "text-base" : "text-[18px] sm:text-[20px]"} font-bold tracking-[-0.03em] leading-none`}
    >
      techlog
    </span>
  );
}
