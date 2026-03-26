"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import Image from "next/image";

interface Service {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  image: string;
}

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const modalSections = [
  {
    title: "About this Service",
    content: "We provide a comprehensive approach to digital product design, ensuring that every detail is aligned with your business goals and user needs. Our process is transparent, iterative, and focused on delivering high-quality results."
  },
  {
    title: "Our Step-by-Step Plan",
    content: "From initial discovery and research to wireframing, prototyping, and final handoff. We follow a structured methodology that minimizes risks and maximizes impact, keeping you informed at every stage of the journey."
  },
  {
    title: "Main Deliverables",
    content: "You will receive a complete design system, high-fidelity interactive prototypes, and developer-ready assets. Everything is documented and organized to ensure a smooth transition to the development phase."
  },
  {
    title: "Why Choose This Offer?",
    content: "Combining technical expertise with a deep understanding of user behavior. We don&apos;t just design interfaces; we build digital ecosystems that scale, convert, and provide a premium experience for your customers."
  }
];

export default function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!service) return null;

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
            className="bg-surface-card sm:rounded-[16px] w-full max-w-[1500px] h-[10h] sm:max-h-[90vh] py-24 overflow-y-auto flex flex-col justify-start relative sm:hide-scrollbar shadow-2xl"
          >
            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 px-8 sm:px-12 pb-12">

              {/* Left Column: Content */}
              <div className="lg:col-span-6 xl:col-span-6">

                {/* Header */}
                <div className="flex items-center h-10">
                  <h3 className="text-display-h5 uppercase tracking-widest leading-none whitespace-nowrap">{service.title}</h3>
                </div>

                {/* Hero Image */}
                <div className="rounded-xl overflow-hidden aspect-[16/9] md:aspect-[4/3] w-full mt-8 mb-12 bg-surface-base relative">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover grayscale opacity-80"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-text-muted opacity-10 pointer-events-none">
                    <service.icon size={120} />
                  </div>
                </div>

                {/* Text Sections */}
                <div className="flex flex-col">
                  {modalSections.map((section, idx) => (
                    <div key={idx} className="mb-10 last:mb-0">
                      <h4 className="text-body-sm font-semibold uppercase tracking-wider text-text-main mb-4">
                        {section.title}
                      </h4>
                      <p className="text-body-md text-text-secondary leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  ))}
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
                        <span className="text-body-sm text-text-secondary font-medium block mb-1">Desde</span>
                        <h2 className="text-heading-h1 leading-none">6.500€</h2>
                      </div>

                      <p className="text-body-sm text-text-secondary">
                        This service contains 2 payment milestones to ensure project security and satisfaction.
                      </p>

                    </div>

                    {/* Milestones Block */}
                    <div className="bg-white rounded-[16px] p-5 py-8 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-text-main flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                          <span className="text-body-sm font-medium">Kickoff Payment</span>
                        </div>
                        <span className="text-body-sm font-semibold">500€</span>
                      </div>
                      <div className="h-[1px] bg-surface-border w-full" />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-surface-border" />
                          <span className="text-body-sm font-medium">Final Delivery</span>
                        </div>
                        <span className="text-body-sm font-semibold">Balance</span>
                      </div>
                    </div>

                    {/* Additional Details List */}
                    <ul className="space-y-3 mt-2">
                      {[
                        "Standardized Design System",
                        "3 Iterative Design Rounds",
                        "High-Fidelity Interactive Prototype",
                        "Developer-Ready Assets (Figma)",
                        "Estimated Duration: 4-6 weeks"
                      ].map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-body-xs md:text-body-sm text-text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-main/40 mt-[0.6em]" />
                          {detail}
                        </li>
                      ))}
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
      )}
    </AnimatePresence>
  );
}
