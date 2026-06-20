"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Cube,
  DeviceMobile,
  Globe,
  Target,
  Browsers,
  Planet,
  Detective,
  RocketLaunch,
  Microscope,
  Sparkle,
  ArrowUpRight,
  ArrowRight,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import TransitionLink from "@/components/common/TransitionLink";
import ServiceModal from "./ServiceModal";
import { Service } from "@/types";
import { t } from "@/lib/i18n";

/**
 * <ServicesList />
 *
 * Llistat de serveis a /serveis. Cada servei és una row clicable que obre
 * el ServiceModal amb detalls complets.
 *
 * Coses notables:
 * - Icones de Phosphor (coherent amb la resta del portfolio).
 * - Mapping flexible: l'admin pot escriure el nom de Lucide vell (Box) o
 *   el nou de Phosphor (Cube) — els dos resolen a la mateixa icona.
 * - CTA visible permanent (ArrowUpRight) perquè la card es percebi com a
 *   clicable abans del hover.
 * - Hover: la imatge passa de grayscale a color + el títol es desplaça
 *   lleugerament a la dreta + l'arrow rota.
 */

interface ServicesListProps {
  services: Service[];
}

/**
 * Resol el nom d'una icona (vell de Lucide o nou de Phosphor) a un
 * component de Phosphor. Manté compat amb dades antigues a Supabase.
 */
const ICON_MAP: Record<string, PhosphorIcon> = {
  // Phosphor nous
  Cube,
  DeviceMobile,
  Globe,
  Target,
  Browsers,
  Planet,
  Detective,
  RocketLaunch,
  Microscope,
  Sparkle,
  // Aliases per a noms vells de Lucide
  Box: Cube,
  Smartphone: DeviceMobile,
  LayoutTemplate: Browsers,
  Sparkles: Sparkle,
};

function getIcon(iconName: string): PhosphorIcon {
  return ICON_MAP[iconName] || Sparkle;
}

export default function ServicesList({ services }: ServicesListProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openService = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  // Empty state — apunta a /contacte (no a mailto inventat)
  if (services.length === 0) {
    return (
      <section id="serveis-list" className="w-full px-6 md:px-12 lg:px-16 xl:px-24 py-20 bg-surface-base">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="py-32 flex flex-col items-start gap-8 max-w-2xl mx-auto text-center items-center"
        >
          <p className="text-body-2xl text-text-secondary leading-relaxed">
            Estic actualitzant l&apos;oferta de serveis. Si tens un projecte
            entre mans, m&apos;encantarà saber-ne més.
          </p>
          <TransitionLink
            href="/contacte"
            className="group inline-flex items-center gap-3 text-text-main hover:text-accent transition-colors duration-300 text-body-lg font-medium pb-1 border-b border-text-main hover:border-accent"
          >
            <span>Parlem-ne</span>
            <ArrowRight size={20} weight="regular" className="group-hover:translate-x-1 transition-transform" />
          </TransitionLink>
        </motion.div>
      </section>
    );
  }

  return (
    <>
      <section id="serveis-list" className="w-full px-6 md:px-12 lg:px-16 xl:px-24 py-20 bg-surface-base">
        <div className="flex flex-col w-full">
          {services.map((service, index) => {
            const Icon = getIcon(service.icon_name);
            const title = t(service.title);
            const description = t(service.short_description);
            const slug = t(service.slug);

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => openService(service)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openService(service);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Veure detalls del servei ${title}`}
                className="group flex flex-col md:flex-row items-start md:items-stretch gap-12 lg:gap-24 justify-between py-20 md:py-48 border-t border-surface-border last:border-b cursor-pointer transition-all duration-500 hover:bg-surface-border/5 focus-visible:outline-none focus-visible:bg-surface-border/10 relative"
                data-slug={slug}
              >
                {/* Columna Esquerra: Icona + Títol */}
                <div className="flex flex-col items-start justify-center w-full md:w-4/12">
                  <Icon
                    size={118}
                    weight="light"
                    className="mb-8 md:mb-0 text-text-main transition-transform duration-700 group-hover:scale-105"
                  />
                  <h3 className="text-heading-h1 font-medium tracking-tight mt-4 transition-transform duration-500 group-hover:translate-x-2">
                    {title}
                  </h3>
                </div>

                {/* Columna Centre: Descripció + CTA */}
                <div className="flex flex-col justify-between w-full md:w-4/12 mt-6 md:mt-0 md:pr-12 pt-8 pb-8">
                  <p className="text-body-lg text-text-secondary leading-relaxed pt-2">
                    {description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-body-md font-medium border-b border-text-main/30 group-hover:border-accent group-hover:text-accent transition-colors duration-300 w-fit pb-0.5 mt-8 md:mt-0">
                    <span>Veure detalls</span>
                    <ArrowRight
                      size={16}
                      weight="regular"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>
                </div>

                {/* Columna Dreta: Imatge + CTA permanent (ArrowUpRight) */}
                <div className="w-full md:w-4/12 h-64 md:h-80 overflow-hidden mt-8 md:mt-0 relative bg-surface-image">
                  {/* CTA arrow al cantó superior dret — visible sempre, no només al hover */}
                  <div className="absolute top-4 right-4 z-10 size-10 rounded-full bg-surface-card/80 backdrop-blur-sm flex items-center justify-center text-text-main transition-all duration-500 group-hover:bg-accent group-hover:text-text-main group-hover:rotate-0 -rotate-12">
                    <ArrowUpRight size={18} weight="regular" />
                  </div>

                  {/* Icona com a placeholder de fons (quan no hi ha imatge) */}
                  {!service.image_url && (
                    <div className="absolute inset-0 flex items-center justify-center text-text-secondary/20">
                      <Icon size={120} weight="thin" />
                    </div>
                  )}

                  {service.image_url && (
                    <Image
                      src={service.image_url}
                      alt={typeof title === "string" ? title : "Service image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
      />
    </>
  );
}
