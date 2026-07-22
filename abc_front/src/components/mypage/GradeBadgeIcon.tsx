// 회원 등급(씨앗/새싹/나무/도토리) 뱃지 아이콘 — 이미지 에셋 없이 currentColor 기반 SVG로 그린다.
type GradeBadgeIconProps = {
  gradeLevel?: number;
  gradeName?: string;
  size?: number;
  className?: string;
};

const gradeLevelByName: Record<string, number> = {
  씨앗: 1,
  새싹: 2,
  나무: 3,
  도토리: 4,
};

export function GradeBadgeIcon({ gradeLevel, gradeName, size = 20, className }: GradeBadgeIconProps) {
  const level = gradeLevel ?? (gradeName ? gradeLevelByName[gradeName] : undefined) ?? 1;
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true as const,
    className,
  };

  if (level >= 4) {
    // 도토리
    return (
      <svg {...svgProps}>
        <path d="M9 9c0-3 1.4-5 3-5s3 2 3 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M7.5 9h9c.5 2-1 3-1 3v6a3.5 3.5 0 0 1-7 0v-6s-1.5-1-1-3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </svg>
    );
  }

  if (level === 3) {
    // 나무
    return (
      <svg {...svgProps}>
        <path
          d="M12 3 7.2 11h3.1l-4 6.2h5.2V21M12 3l4.8 8h-3.1l4 6.2h-5.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </svg>
    );
  }

  if (level === 2) {
    // 새싹
    return (
      <svg {...svgProps}>
        <path d="M12 21v-9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.14"
        />
        <path
          d="M12 14.5c0-3-2.8-5-6-5 0 3 2.8 5 6 5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </svg>
    );
  }

  // 씨앗
  return (
    <svg {...svgProps}>
      <ellipse cx="12" cy="13.5" rx="4.5" ry="6" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.14" />
      <path d="M12 7.5c0-2 1-3.5 2.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
