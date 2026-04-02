"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Box, Smartphone, Globe, Target, LayoutTemplate, Sparkles, LucideIcon } from "lucide-react";
import ServiceModal from "./ServiceModal";
import Image from "next/image";
import { Service } from "@/types";

interface ServicesListProps {
  services: Service[];
}

const getIcon = (iconName: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    Box,
    Smartphone,
    Globe,
    Target,
    LayoutTemplate,
    Sparkles,
  };
  return icons[iconName] || Sparkles;
};

const getTranslation = (field: any, locale = 'ca') => {
  if (typeof field === 'object' && field !== null) {
    return (field as any)[locale] || (field as any).ca || "";
  }
  return field || "";
};

export default function ServicesList({ services }: ServicesListProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openService = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <>
      <section id="serveis-list" className="w-full px-6 md:px-12 lg:px-16 xl:px-24 py-20 bg-surface-base">
        <div className="flex flex-col w-full">
          {services.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="py-32 flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
            >
              <p className="text-body-xl text-text-secondary leading-relaxed mb-10">
                Actualment estic actualitzant la meva oferta de serveis per oferir-te la millor experiència possible.
                Torna d&apos;aquí a poc o, si tens un projecte urgent, parlem!
              </p>
              <a
                href="mailto:hola@marius.design"
                className="text-body-md font-medium border-b border-text-main/30 hover:border-text-main transition-colors pb-0.5"
              >
                Contactar ara
              </a>
            </motion.div>
          ) : (
            services.map((service, index) => {
              const Icon = getIcon(service.icon_name);
              const title = getTranslation(service.title);
              const description = getTranslation(service.short_description);

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => openService(service)}
                  className="group flex flex-col md:flex-row items-start md:items-stretch gap-12 lg:gap-24 justify-between py-12 border-t border-surface-border last:border-b cursor-pointer transition-colors hover:bg-surface-border/5"
                >
                  {/* Columna Esquerra: Icona + Títol */}
                  <div className="flex flex-col items-start justify-center w-full md:w-4/12">
                    <Icon size={118} strokeWidth={1.5} className="mb-8 md:mb-0" />
                    <h3 className="text-heading-h1 font-medium tracking-tight mt-4">{title}</h3>
                  </div>

                  {/* Columna Centre: Descripció + Link */}
                  <div className="flex flex-col justify-between w-full md:w-4/12 mt-6 md:mt-0 md:pr-12 pt-8 pb-8">
                    <p className="text-body-md text-text-secondary leading-relaxed pt-2">
                      {description}
                    </p>
                    <div className="text-body-sm font-medium border-b border-text-main/30 group-hover:border-text-main transition-colors w-fit pb-0.5 mt-8 md:mt-0">
                      Més informació
                    </div>
                  </div>

                  {/* Columna Dreta: Imatge */}
                  <div className="w-full md:w-4/12 h-64 md:h-80 overflow-hidden mt-8 md:mt-0 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted opacity-20">
                      <Icon size={48} />
                    </div>
                    {service.image_url && (
                      <Image
                        src={service.image_url}
                        alt={typeof title === 'string' ? title : "Service image"}
                        fill
                        className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
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