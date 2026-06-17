"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import TransitionLink from "../common/TransitionLink";
import WorksGrid from "../works/WorksGrid";
import type { Project } from "@/types";

/**
 * <WorksTeaserInteractive />
 *
 * Part Client del WorksTeaser. Renderitza el grid + el custom cursor
 * que apareix quan l'usuari fa hover sobre un projecte. Rep els
 * projectes ja mapejats des del Server Component pare.
 *
 * Si no hi ha projectes, el component pare ja s'encarrega de no muntar-lo
 * — així evitem el cas trist d'un empty state al Home.
 */
export default function WorksTeaserInteractive({ projects }: { projects: Project[] }) {
  const [hoveredProject, setHoveredProject] = useState<string | number | null>(null);

  // Custom cursor que segueix el ratolí en hover sobre projectes
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 60);
      mouseY.set(e.clientY - 60);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      <WorksGrid projects={projects} onProjectHover={setHoveredProject} />

      {/* Custom cursor amb fletxa, fixat a la pantalla */}
      <motion.div
        style={{ x: smoothX, y: smoothY }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: hoveredProject !== null ? 1 : 0,
          opacity: hoveredProject !== null ? 1 : 0,
        }}
        transition={{ type: "tween", ease: "circOut", duration: 0.2 }}
        className="fixed top-0 left-0 w-[120px] h-[120px] bg-white text-black rounded-full pointer-events-none z-[100] shadow-[0px_4px_30px_rgba(0,0,0,0.1)] hidden md:flex items-center justify-center transform-gpu"
        aria-hidden="true"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </motion.div>
    </>
  );
}
