// 숫자가 마운트 시 0에서 목표값까지 올라가는 카운트업 애니메이션 — 마이페이지 카운트 타일 등에서 사용
import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';

type CountUpValueProps = {
  value: number;
  suffix?: string;
  duration?: number;
};

export function CountUpValue({ value, suffix = '', duration = 0.8 }: CountUpValueProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => `${Math.round(latest).toLocaleString('ko-KR')}${suffix}`);

  useEffect(() => {
    if (prefersReducedMotion) {
      motionValue.set(value);
      return;
    }

    const controls = animate(motionValue, value, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, duration, prefersReducedMotion, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}
