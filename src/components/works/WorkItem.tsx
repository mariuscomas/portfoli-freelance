"use client";

import React from "react";
import TransitionLink from "@/components/common/TransitionLink";
import Image from "next/image";
import { motion } from "framer-motion";
import RevealGroup from "@/components/common/RevealGroup";

import { Project } from "@/types";

interface WorkItemProps {
  project: Project;
  index: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /**
   * "clip" (només la home, guió 21set26): cada card és el seu propi grup
   * d'entrada; la imatge es destapa des de baix amb clip-path + escala
   * 1,06 → 1 i el text puja després (G2). El relleu entre columnes és de
   * 120 ms. Sense prop, /works conserva el fade-up de framer-motion.
   */
  reveal?: "clip";
}

export default function WorkItem({ project, index, onMouseEnter, onMouseLeave, reveal }: WorkItemProps) {
  const href = project.slug ? `/works/${project.slug}` : "#";
  const clip = reveal === "clip";
  const cardDelay = (index % 2) * 120;

  const card = (
      <TransitionLink
        href={href}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="group flex flex-col gap-6 w-full cursor-pointer md:cursor-none"
      >
        <div
          style={clip ? ({ "--reveal-delay": `${cardDelay}ms` } as React.CSSProperties) : undefined}
          className={`${clip ? "reveal-clip " : ""}w-full aspect-square bg-text-main/5 relative overflow-hidden flex items-center justify-center rounded-sm`}
        >
          <div className="absolute inset-0 bg-text-main/[0.03] group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
          {project.image ? (
            <div className={`${clip ? "reveal-clip-media " : ""}absolute inset-0`}>
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transform scale-100 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
            </div>
          ) : (
            <div className={`w-full h-full ${project.bgColor || "bg-text-secondary/10"} flex items-center justify-center text-text-secondary`}>
                <span className="text-display-2xs-medium lg:text-display-xs-medium opacity-50 uppercase tracking-widest">Project Image</span>
            </div>
          )}
        </div>
        <div
          style={clip ? ({ "--reveal-delay": `${cardDelay + 200}ms` } as React.CSSProperties) : undefined}
          className={`${clip ? "reveal-up " : ""}flex flex-col gap-2`}
        >
          <h3 className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main group-hover:ml-2 transition-all duration-300">
            {project.title}
          </h3>
          <p className="text-body-s md:text-body-m lg:text-body-l text-text-secondary uppercase tracking-wider group-hover:ml-2 transition-all duration-300">
            {project.category}
          </p>
        </div>
      </TransitionLink>
  );

  if (clip) return <RevealGroup>{card}</RevealGroup>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {card}
    </motion.div>
  );
}
