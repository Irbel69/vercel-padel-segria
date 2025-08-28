import { useRef } from "react";
import { useScroll, useTransform, MotionValue } from "framer-motion";

interface UseScrollScaleOptions {
  scaleRange?: [number, number];
  offsetStart?: number;
  offsetEnd?: number;
}

interface UseScrollScaleReturn {
  ref: React.RefObject<HTMLDivElement>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  brightness: MotionValue<number>;
}

export function useScrollScale({
  scaleRange = [0.96, 1.02],
  offsetStart = 0.3,
  offsetEnd = 0.7,
}: UseScrollScaleOptions = {}): UseScrollScaleReturn {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.1"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [scaleRange[0], scaleRange[1], scaleRange[0]]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.85, 1, 1, 0.85]);
  const brightness = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.08, 1]);

  return {
    ref,
    scale,
    opacity,
    brightness,
  };
}