"use client";

import React from "react";
import TransitionLink from "@/components/common/TransitionLink";
import Image from "next/image";
import { motion } from "framer-motion";

import { Project } from "@/types";

interface WorkItemProps {
  project: Project;
  index: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function WorkItem({ project, index, onMouseEnter, onMouseLeave }: WorkItemProps) {
  const href = project.slug ? `/works/${project.slug}` : "#";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <TransitionLink
        href={href}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="group flex flex-col gap-6 w-full cursor-pointer md:cursor-none"
      >
        <div className="w-full aspect-square bg-text-main/5 relative overflow-hidden flex items-center justify-center rounded-sm">
          <div className="absolute inset-0 bg-text-main/[0.03] group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transform scale-100 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <div className={`w-full h-full ${project.bgColor || "bg-text-secondary/10"} flex items-center justify-center text-text-secondary`}>
                <span className="font-heading text-xl opacity-50 uppercase tracking-widest">Project Image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-3xl lg:text-4xl font-medium tracking-tight text-text-main group-hover:ml-2 transition-all duration-300">
            {project.title}
          </h3>
          <p className="text-lg text-text-muted uppercase tracking-wider group-hover:ml-2 transition-all duration-300">
            {project.category}
          </p>
        </div>
      </TransitionLink>
    </motion.div>
  );
}
