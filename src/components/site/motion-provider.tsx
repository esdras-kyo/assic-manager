"use client";

import { MotionConfig } from "motion/react";

/** Animações respeitam prefers-reduced-motion do sistema (planoassic §5.3). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
