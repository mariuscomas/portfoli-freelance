"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const projects = [
  { id: 1, title: "Fintech App", category: "UX/UI & Product Design", bgColor: "bg-surface-elevated" },
  { id: 2, title: "SaaS Dashboard", category: "Web App & Design System", bgColor: "bg-surface-elevated" },
  { id: 3, title: "E-commerce Platform", category: "UX Research & Mobile App", bgColor: "bg-surface-elevated" },
  { id: 4, title: "AI Assistant Interface", category: "Interaction & Artificial Intelligence", bgColor: "bg-surface-elevated" }
];

export default function WorksTeaser() {
  return (
    <section className="w-full py-16 md:py-32 px-4 md:px-[3vw] lg:px-[4vw] bg-surface-base">
      <div className="w-full">
        {/* Header section with H2 */}
        <div className="flex justify-between items-end mb-16 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-5xl md:text-7xl lg:text-[140px] uppercase text-text-main leading-none m-0"
          >
            Treballs
          </motion.h2>

          <Link
            href="/works"
            className="font-sans text-lg hidden md:block text-text-secondary hover:text-text-main transition-colors pb-4 border-b border-text-secondary/30 hover:border-text-main"
          >
            Veure tots els projectes →
          </Link>
        </div>

        {/* Works Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 xl:gap-24 items-start">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6 group cursor-pointer w-full"
            >
              <div className={`w-full aspect-square overflow-hidden rounded-none ${project.bgColor} relative`}>
                <div className="absolute inset-0 bg-text-main/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                {/* Placeholder per imatge de cas d'estudi */}
                <div className="w-full h-full bg-text-secondary/10 flex items-center justify-center text-text-secondary">
                  <span className="font-heading text-xl opacity-50">Imatge del projecte</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-heading uppercase text-3xl lg:text-4xl text-text-main group-hover:ml-2 transition-all duration-300">
                  {project.title}
                </h3>
                <p className="font-sans text-text-secondary text-lg uppercase tracking-wider group-hover:ml-2 transition-all duration-300">
                  {project.category}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
