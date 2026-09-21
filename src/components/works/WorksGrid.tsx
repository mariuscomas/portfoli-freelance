"use client";

import React from "react";
import WorkItem from "./WorkItem";
import { Project } from "@/types";

interface WorksGridProps {
  projects: Project[];
  onProjectHover?: (id: string | number | null) => void;
  className?: string;
  /** Substitueix el padding lateral i els gaps per defecte (sense tailwind-merge,
   *  afegir-los a className no guanyaria). La home hi passa els tokens del Figma. */
  spacingClassName?: string;
  /** "clip": entrada del guió de la home (21set26). Sense prop, l'entrada de sempre. */
  reveal?: "clip";
}

const DEFAULT_SPACING = "px-4 md:px-[3vw] lg:px-[2vw] gap-y-16 gap-x-2 lg:gap-x-4 xl:gap-8";

export default function WorksGrid({
  projects,
  onProjectHover,
  className = "",
  spacingClassName = DEFAULT_SPACING,
  reveal,
}: WorksGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 w-full ${spacingClassName} ${className}`}>
      {projects.map((project, index) => (
        <WorkItem
          key={project.id}
          project={project}
          index={index}
          reveal={reveal}
          onMouseEnter={() => onProjectHover?.(project.id)}
          onMouseLeave={() => onProjectHover?.(null)}
        />
      ))}
    </div>
  );
}
