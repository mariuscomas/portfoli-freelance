"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Box, Smartphone, Globe, Target, LayoutTemplate, Sparkles, LucideIcon } from "lucide-react";
import Image from "next/image";
import { Service } from "@/types";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
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

export default function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!service || !mounted) return null;

  const Icon = getIcon(service.icon_name);
  const title = getTranslation(service.title);
  const content_about = getTranslation(service.content_about);
  const content_steps = getTranslation(service.content_steps);
  const content_deliverables = getTranslation(service.content_deliverables);
  const content_why_us = getTranslation(service.content_why_us);
  const revisions = getTranslation(service.revisions);
  const duration = getTranslation(service.duration);
  const price = service.price_starts_at ? `${service.price_starts_at.toLocaleString('de-DE')}€` : "Consultar";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex sm:items-center justify-center sm:p-4 md:p-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card sm:rounded-[16px] w-full max-w-[1500px] h-[100vh] sm:max-h-[90vh] py-24 overflow-y-auto flex flex-col justify-start relative sm:hide-scrollbar shadow-2xl"
          >
            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 px-8 sm:px-12 pb-12">

              {/* Left Column: Content */}
              <div className="lg:col-span-6 xl:col-span-6">

                {/* Header */}
                <div className="flex items-center h-10">
                  <h3 className="text-display-h5 uppercase tracking-widest leading-none whitespace-nowrap">{title}</h3>
                </div>

                {/* Hero Image */}
                <div className="rounded-xl overflow-hidden aspect-[16/9] md:aspect-[4/3] w-full mt-8 mb-12 bg-surface-base relative">
                  {service.image_url && (
                    <Image
                      src={service.image_url}
                      alt={typeof title === 'string' ? title : "Service image"}
                      fill
                      className="object-cover grayscale opacity-80"
                      priority
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center text-text-muted opacity-10 pointer-events-none">
                    {React.createElement(Icon, { size: 120 })}
                  </div>
                </div>

                {/* Text Sections */}
                <div className="flex flex-col gap-12">
                  {content_about && (
                    <div className="flex flex-col">
                      <h4 className="text-body-sm font-semibold uppercase tracking-wider text-text-main mb-4">
                        Sobre aquest servei
                      </h4>
                      <p className="text-body-md text-text-secondary leading-relaxed">
                        {content_about}
                      </p>
                    </div>
                  )}

                  {content_steps && (
                    <div className="flex flex-col">
                      <h4 className="text-body-sm font-semibold uppercase tracking-wider text-text-main mb-4">
                        El nostre pla, pas a pas
                      </h4>
                      <p className="text-body-md text-text-secondary leading-relaxed">
                        {content_steps}
                      </p>
                    </div>
                  )}

                  {content_deliverables && (
                    <div className="flex flex-col">
                      <h4 className="text-body-sm font-semibold uppercase tracking-wider text-text-main mb-4">
                        Principals lliuraments
                      </h4>
                      <p className="text-body-md text-text-secondary leading-relaxed">
                        {content_deliverables}
                      </p>
                    </div>
                  )}

                  {content_why_us && (
                    <div className="flex flex-col">
                      <h4 className="text-body-sm font-semibold uppercase tracking-wider text-text-main mb-4">
                        Per què triar aquesta oferta?
                      </h4>
                      <p className="text-body-md text-text-secondary leading-relaxed">
                        {content_why_us}
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Pricing Card */}
              <div className="lg:col-span-6 xl:col-span-6 relative">
                <div className="lg:sticky lg:top-0 flex flex-col">
                  {/* Close Button Row - Aligned with the Title */}
                  <div className="flex items-center justify-end h-10">
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-surface-base rounded-full transition-colors"
                      aria-label="Close modal"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="bg-surface-base rounded-[24px] mt-8 p-12 py-16 flex flex-col gap-8 border border-surface-border/50">

                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-body-sm text-text-secondary font-medium block mb-1">Des de</span>
                        <h2 className="text-heading-h1 leading-none">{price}</h2>
                      </div>

                      <p className="text-body-sm text-text-secondary">
                        Aquest servei conté 2 fites de pagament per garantir la seguretat i satisfacció del projecte.
                      </p>

                    </div>

                    {/* Milestones Block */}
                    <div className="bg-white rounded-[16px] p-5 py-8 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-text-main flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                          <span className="text-body-sm font-medium">Pagament Inicial</span>
                        </div>
                        <span className="text-body-sm font-semibold">50%</span>
                      </div>
                      <div className="h-[1px] bg-surface-border w-full" />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-surface-border" />
                          <span className="text-body-sm font-medium">Lliurament Final</span>
                        </div>
                        <span className="text-body-sm font-semibold">50%</span>
                      </div>
                    </div>

                    {/* Additional Details List */}
                    <ul className="space-y-3 mt-2">
                      <li className="flex items-start gap-3 text-body-xs md:text-body-sm text-text-secondary">
                        <span className="font-semibold">Concepts and revision:</span>
                        {revisions}
                      </li>
                      <li className="flex items-start gap-3 text-body-xs md:text-body-sm text-text-secondary">
                        <span className="font-semibold">Project Duration:</span>
                        {duration}
                      </li>
                    </ul>

                    <button className="w-full bg-text-main text-surface-base py-4 rounded-xl font-medium hover:opacity-90 transition-opacity mt-2">
                      Contactar amb nosaltres
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </motion.div>
        </motion.div>
      )
      }
    </AnimatePresence >
  );
}
