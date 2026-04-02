"use client";

import React from "react";
import WorkItem from "./WorkItem";
import { Project } from "@/types";

interface WorksGridProps {
  projects: Project[];
  onProjectHover?: (id: string | number | null) => void;
  className?: string;
}

export default function WorksGrid({ projects, onProjectHover, className = "" }: WorksGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 px-4 md:px-[3vw] lg:px-[2vw] gap-y-16 gap-x-2 lg:gap-x-4 xl:gap-8 w-full ${className}`}>
      {projects.map((project, index) => (
        <WorkItem
          key={project.id}
          project={project}
          index={index}
          onMouseEnter={() => onProjectHover?.(project.id)}
          onMouseLeave={() => onProjectHover?.(null)}
        />
      ))}
    </div>
  );
}
