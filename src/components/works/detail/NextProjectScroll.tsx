"use client";

import { useRef, useState } from "react";
import { WorkNextProject } from "@/types/works";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  nextProject: WorkNextProject;
}

export default function NextProjectScroll({ nextProject }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  // La barra de progrés anirà omplint-se a mesura que l'usuari baixa i el component entra en pantalla.
  // Quan el final del component toqui el final de la pantalla (és a dir, s'ha vist tot), valdrà 1.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Quan estem pràcticament abaix de tot i veient el footer complet
    if (latest >= 0.98 && !navigating) {
      setNavigating(true);
      router.push(`/works/${nextProject.slug}`);
    }
  });

  return (
    <section 
      ref={containerRef} 
      className="relative w-full bg-surface-base pt-16 md:pt-32 pb-16 md:pb-32 flex flex-col justify-center overflow-hidden border-t border-text-main/10"
    >
      <div className="w-full">
        {/* Top Content: Grid for layout (Text a l'esquerra, Progress bar a la dreta) */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 lg:px-24 mb-16 md:mb-24">
          
          <h2 className="text-xl md:text-3xl text-text-main font-sans font-light leading-snug w-full md:w-1/2">
            Continua desplaçant-te per <br className="hidden md:block" /> veure el següent cas pràctic.
          </h2>
          
          <div className="w-full md:w-1/3 flex justify-end mt-8 md:mt-0 opacity-80">
            <div className="w-full h-[2px] bg-text-main/10 relative rounded-full overflow-hidden max-w-sm">
              <motion.div 
                style={{ width: progressBarWidth }}
                className="absolute top-0 left-0 h-full bg-text-main origin-left"
              />
            </div>
          </div>

        </div>

        {/* Marquee Next Project Title */}
        <Link 
          href={`/works/${nextProject.slug}`} 
          className="relative block left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-hidden group cursor-pointer"
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 40,
            }}
            className="text-display-h1 font-heading uppercase flex items-center gap-8 lg:gap-8 w-max px-6 md:px-12 lg:px-24 shrink-0 py-2 transform-gpu will-change-transform group-hover:text-text-secondary transition-colors"
          >
            {/* Set 1 */}
            <span className="text-text-main">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>

            {/* Set 2 (for seamless loop) */}
            <span className="text-text-main">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>
          </motion.div>
        </Link>
      </div>
    </section>
  );
}
