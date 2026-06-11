"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";

/** Momento de celebração (§5.3): movimento curto, a serviço da clareza. */
export function SucessoAnimado({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex size-24 items-center justify-center rounded-full bg-success"
      >
        <Check
          aria-hidden
          className="size-12 text-success-foreground"
          strokeWidth={3}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="mt-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
