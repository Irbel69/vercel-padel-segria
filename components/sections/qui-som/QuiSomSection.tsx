"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Emphasis from "@/components/ui/emphasis";

/**
 * QuiSomSection - Aligned with site visual language
 * - Uses the same glass/card idiom and subtle blurred blobs as other sections
 * - Removes the aggressive gradient from the first implementation
 */
export default function QuiSomSection() {
  return (
    <section
      id="qui-som"
      aria-labelledby="qui-som-title"
      className="py-20 relative overflow-visible"
    >
      {/* Subtle background blobs consistent with other sections */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-padel-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-padel-primary/6 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2
              id="qui-som-title"
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Qui som
            </h2>
            <p className="mt-3 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed md:leading-8 lg:leading-9">
              <Emphasis>Som tres amics de sempre</Emphasis>, enamorats del pàdel i amb la il·lusió de donar-li una nova dimensió. El nostre projecte és molt més que jugar partits: volem <Emphasis>crear una comunitat on el pàdel sigui sinònim de diversió</Emphasis>, connexió i bons moments.
            </p>
            <p className="mt-5 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed md:leading-8 lg:leading-9">
              Creiem en un espai on els torneigs, els tardeos i les activitats lúdiques s&apos;uneixen per fer créixer la passió per aquest esport. Un lloc obert a tothom, on cada punt compta i cada trobada es recorda.
            </p>

            <p className="mt-5 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed md:leading-8 lg:leading-9 pb-2 md:pb-0">
              Benvinguts a <Emphasis>la nostra comunitat, la vostra nova casa del pàdel!</Emphasis>
            </p>

            <div className="flex justify-center mt-5">
              <Button asChild className="w-full sm:w-auto bg-padel-primary">
                <Link
                  href="/dashboard"
                  className="bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 font-semibold py-3 px-6 rounded-lg inline-block text-center"
                >
                  Uneix-te a la comunitat
                </Link>
              </Button>
            </div>
          </div>

          {/* Glass card to host the content (matches Contact/TopPlayers style) */}
        </div>
      </div>
    </section>
  );
}
