"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Box, Smartphone, Globe, Target, LayoutTemplate, Sparkles } from "lucide-react";
import ServiceModal from "./ServiceModal";
import Image from "next/image";

const servicesData = [
  {
    id: 1,
    title: "Product Design",
    description: "Creació de productes digitals d'extrem a extrem, des de la conceptualització fins al prototipatge d'alta fidelitat.",
    icon: Box,
    image: "/images/image_treballs_prova.png"
  },
  {
    id: 2,
    title: "Mobile App Design",
    description: "Disseny d'experiències mòbils natives i responsives centrades en la usabilitat i el rendiment.",
    icon: Smartphone,
    image: "/images/image_treballs_prova.png"
  },
  {
    id: 3,
    title: "Website Design",
    description: "Webs corporatives i portfolios amb un enfocament editorial, tipografia cuidada i narrativa visual clara.",
    icon: Globe,
    image: "/images/image_treballs_prova.png"
  },
  {
    id: 4,
    title: "UI/UX Design Audit",
    description: "Anàlisi profunda de la teva interfície actual per identificar punts de fricció i oportunitats de millora estructural.",
    icon: Target,
    image: "/images/image_treballs_prova.png"
  },
  {
    id: 5,
    title: "Landing Page Design",
    description: "Pàgines d'aterratge optimitzades per a la conversió amb un disseny d'alt impacte visual.",
    icon: LayoutTemplate,
    image: "/images/image_treballs_prova.png"
  },
  {
    id: 6,
    title: "Branding & Identity Design",
    description: "Definició de sistemes visuals que transmeten els valors de marca de manera coherent en tot l'ecosistema digital.",
    icon: Sparkles,
    image: "/images/image_treballs_prova.png"
  }
];

export default function ServicesList() {
  const [selectedService, setSelectedService] = useState<typeof servicesData[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openService = (service: typeof servicesData[0]) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <>
      <section id="serveis-list" className="w-full px-6 md:px-12 lg:px-16 xl:px-24 py-20 bg-surface-base">
        <div className="flex flex-col w-full">
          {servicesData.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => openService(service)}
              // CLAU 1: md:items-stretch fa que totes les columnes tinguin l'alçada de la imatge
              className="group flex flex-col md:flex-row items-start md:items-stretch gap-12 lg:gap-24 justify-between py-12 border-t border-surface-border last:border-b cursor-pointer transition-colors hover:bg-surface-border/5"
            >
              {/* Columna Esquerra: Icona + Títol */}
              <div className="flex flex-col items-start justify-center w-full md:w-4/12">
                <service.icon size={118} strokeWidth={1.5} className="mb-8 md:mb-0" />
                <h3 className="text-heading-h1 font-medium tracking-tight mt-4">{service.title}</h3>
              </div>

              {/* Columna Centre: Descripció + Link */}
              <div className="flex flex-col justify-between w-full md:w-4/12 mt-6 md:mt-0 md:pr-12 pt-8 pb-8">
                <p className="text-body-md text-text-secondary leading-relaxed pt-2">
                  {service.description}
                </p>
                <div className="text-body-sm font-medium border-b border-text-main/30 group-hover:border-text-main transition-colors w-fit pb-0.5 mt-8 md:mt-0">
                  Més informació
                </div>
              </div>

              {/* Columna Dreta: Imatge */}
              <div className="w-full md:w-4/12 h-64 md:h-80 overflow-hidden mt-8 md:mt-0 relative rounded-2xl">
                <div className="absolute inset-0 flex items-center justify-center text-text-muted opacity-20">
                  <service.icon size={48} />
                </div>
                <Image 
                  src={service.image} 
                  alt={service.title} 
                  fill
                  className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" 
                />
              </div>
            </motion.div>
          ))}
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