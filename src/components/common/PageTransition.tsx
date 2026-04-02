"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTransition as useAppTransition } from "@/context/TransitionContext";
import LogoSmall from "./LogoSmall";
import { useEffect, useState } from "react";

export default function PageTransition() {
  const { isTransitioning, hasStartedTransition, colorIndex, colors } = useAppTransition();
  const [isAnimationFinished, setIsAnimationFinished] = useState(true);
  const [displayColorIndex, setDisplayColorIndex] = useState(colorIndex);

  useEffect(() => {
    if (isTransitioning) {
      setIsAnimationFinished(false);
      setDisplayColorIndex(colorIndex);
    }
  }, [isTransitioning, colorIndex]);

  // Si no hem començat mai una transició (refresh), no mostrem res
  if (!hasStartedTransition && !isTransitioning) {
    return null;
  }

  // Si la transició ha acabat completament (després de l'animació d'exit)
  if (isAnimationFinished && !isTransitioning) {
    return null;
  }

  return (
    <motion.div
      variants={{
        hidden: { y: "200vh" },
        show: { y: "0vh" },
        exit: { y: "-200vh" }
      }}
      initial="hidden"
      animate={isTransitioning ? "show" : "exit"}
      onAnimationComplete={(definition) => {
        if (definition === "exit") {
          setIsAnimationFinished(true);
        }
      }}
      transition={{ 
        duration: 1.2,
        ease: [0.6, 0.01, 0.35, 1],
      }}
      className="fixed inset-0 h-[200vh] -top-[50vh] z-[9999] flex items-center justify-center pointer-events-none"
      style={{ 
        backgroundColor: colors[displayColorIndex],
        pointerEvents: isTransitioning ? "all" : "none"
      }}
    >
      {/* Contenidor del logo amb efecte Parallax, Drift i Fade-out */}
      <motion.div 
        variants={{
          hidden: { y: "60vh", opacity: 0 },
          show: { 
            y: ["60vh", "0vh", "-15px"],
            opacity: [0, 1, 1],
            transition: { 
              duration: 1.6, // Cobreix l'entrada + part del "stay"
              times: [0, 0.6, 1],
              ease: ["easeOut", "linear"]
            }
          },
          exit: { 
            y: "-60vh", 
            opacity: 0,
            transition: { duration: 0.8, ease: "easeIn" }
          }
        }}
        initial={isTransitioning ? "hidden" : false}
        animate={isTransitioning ? "show" : "exit"}
        className="flex flex-col items-center justify-center"
      >
        <LogoSmall className="w-[100px] h-auto text-text-main scale-[4]" />
      </motion.div>
    </motion.div>
  );
}
