"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import SharedPageHero from "@/components/common/SharedPageHero";
import WorksGrid from "./WorksGrid";
import Link from "next/link";

import { Project } from "@/types";

interface Props {
  projects: Project[];
}

export default function WorksGallery({ projects }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [hoveredProject, setHoveredProject] = useState<string | number | null>(null);

  // Custom Cursor tracking logic
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
    <section className="w-full relative">
      <SharedPageHero
        title="Treballs"
        description="Creació de solucions tangibles i funcionals. Disseny i desenvolupament de plataformes i serveis centrats en l'excel·lència tècnica i l'experiència de l'usuari."
        bottomContent={
          <>
            {/* Scroll Indicator (Left) */}
            <div className="flex items-center gap-3 text-text-muted">
              <span className="text-[24px] font-medium tracking-wider hidden md:inline-block">(Scroll)</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L12 20M12 20L18 14M12 20L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Toggle (Right) */}
            <div className="flex items-center p-2 rounded-full bg-surface-card/40 relative">
              {(["grid", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`relative z-10 px-8 py-2.5 rounded-full text-[24px] font-medium transition-colors duration-300 ${view === mode ? "text-surface-base" : "text-text-main hover:text-text-secondary"
                    }`}
                >
                  {view === mode && (
                    <motion.div
                      layoutId="viewToggleBg"
                      className="absolute inset-0 bg-text-main rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {mode === "grid" ? "Grid" : "List"}
                </button>
              ))}
            </div>
          </>
        }
      />

      {/* Content Gallery Items */}
      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            <WorksGrid projects={projects} onProjectHover={setHoveredProject} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col w-full border-t border-text-main/10 px-6 md:px-12 lg:px-24"
          >
            {projects.map((project) => (
              <Link
                href={`/works/${project.slug}`}
                key={project.id}
                className="group flex flex-row items-center justify-between py-8 lg:py-12 border-b border-text-main/10 hover:px-6 transition-all duration-300 ease-out relative overflow-hidden"
              >
                {/* Background hover subtle effect */}
                <div className="absolute inset-0 bg-text-main/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                <h3 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-text-main group-hover:-translate-y-1 transition-transform duration-300">
                  {project.title}
                </h3>

                <div className="flex items-center gap-12 overflow-hidden">
                  <p className="hidden md:block text-lg lg:text-xl text-text-muted group-hover:text-text-main transition-colors duration-300">
                    {project.category}
                  </p>

                  {/* Animated Arrow that flies in */}
                  <span className="opacity-0 -translate-x-full group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-text-main">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Cursor Component mapped fixed to screen */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: hoveredProject !== null && view === "grid" ? 1 : 0,
          opacity: hoveredProject !== null && view === "grid" ? 1 : 0,
        }}
        transition={{ type: "tween", ease: "circOut", duration: 0.2 }}
        className="fixed top-0 left-0 w-[120px] h-[120px] bg-white text-black rounded-full pointer-events-none z-[100] shadow-[0px_4px_30px_rgba(0,0,0,0.1)] hidden md:flex items-center justify-center transform-gpu will-change-transform"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </motion.div>
    </section>
  );
}
