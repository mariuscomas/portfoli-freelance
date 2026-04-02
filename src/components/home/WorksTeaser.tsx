"use client";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import TransitionLink from "../common/TransitionLink";
import WorksGrid from "../works/WorksGrid";

const projects = [
  { id: 1, title: "Fintech App", category: "UX/UI & Product Design", bgColor: "bg-surface-elevated", slug: "fintech-app", image: "/images/image_treballs_prova.png" },
  { id: 2, title: "SaaS Dashboard", category: "Web App & Design System", bgColor: "bg-surface-elevated", slug: "saas-dashboard", image: "/images/image_treballs_prova.png" },
  { id: 3, title: "E-commerce Platform", category: "UX Research & Mobile App", bgColor: "bg-surface-elevated", slug: "ecommerce-platform", image: "/images/image_treballs_prova.png" },
  { id: 4, title: "AI Assistant Interface", category: "Interaction & Artificial Intelligence", bgColor: "bg-surface-elevated", slug: "ai-assistant", image: "/images/image_treballs_prova.png" }
];

export default function WorksTeaser() {
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
    <section className="w-full py-16 md:py-32 bg-surface-base relative overflow-hidden">
      <div className="w-full">
        {/* Header section with H2 */}
        <div className="flex justify-between items-end mb-16 md:mb-24 px-4 md:px-[3vw] lg:px-[4vw]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-heading-h1 uppercase text-text-main leading-none m-0"
          >
            Treballs
          </motion.h2>

          <TransitionLink
            href="/works"
            className="font-sans text-lg hidden md:block text-text-secondary hover:text-text-main transition-colors pb-4 border-b border-text-secondary/30 hover:border-text-main"
          >
            Veure tots els projectes →
          </TransitionLink>
        </div>

        {/* Works Grid */}
        <div className="w-full">
          <WorksGrid projects={projects} onProjectHover={setHoveredProject} />
        </div>
      </div>

      {/* Custom Cursor Component mapped fixed to screen */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: hoveredProject !== null ? 1 : 0,
          opacity: hoveredProject !== null ? 1 : 0,
        }}
        transition={{ type: "tween", ease: "circOut", duration: 0.2 }}
        className="fixed top-0 left-0 w-[120px] h-[120px] bg-white text-black rounded-full pointer-events-none z-[100] shadow-[0px_4px_30px_rgba(0,0,0,0.1)] hidden md:flex items-center justify-center transform-gpu"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </motion.div>
    </section>
  );
}
