"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContactInfoBlocks } from "./ContactInfoBlocks";
import { CommunityStats } from "./CommunityStats";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Format phone number with +34 prefix and groups of 3
      let phoneValue = value.replace(/\D/g, "");

      // Remove +34 if it's at the beginning for processing
      if (phoneValue.startsWith("34")) {
        phoneValue = phoneValue.substring(2);
      }

      // Limit to 9 digits (Spanish mobile number length)
      phoneValue = phoneValue.substring(0, 9);

      // Format as +34 XXX XXX XXX
      if (phoneValue.length > 0) {
        let formatted = "+34";
        if (phoneValue.length > 0)
          formatted += " " + phoneValue.substring(0, 3);
        if (phoneValue.length > 3)
          formatted += " " + phoneValue.substring(3, 6);
        if (phoneValue.length > 6)
          formatted += " " + phoneValue.substring(6, 9);
        setFormData((prev) => ({ ...prev, [name]: formatted }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: "+34 " }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
    setIsSubmitting(false);

    // Here you would typically send the data to your API
    console.log("Form submitted:", formData);
  };

  // Stats handled via CommunityStats component defaults

  return (
    <section id="contact" className="py-12 md:py-24 relative overflow-visible">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-padel-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-padel-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contacta amb nosaltres
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Tens preguntes sobre els nostres tornejos? Vols unir-te a la
            comunitat de pàdel més gran de Segrià? Escriu-nos i t&apos;ajudarem
            amb tot el que necessitis.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-stretch">
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            <Card
              className="shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <CardContent className="p-4 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-semibold text-white"
                    >
                      Nom complet *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="El teu nom"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={{
                        height: "2.5rem",
                        background: "rgba(255, 255, 255, 0)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                      className="text-white placeholder-gray-300 focus:border-padel-primary transition-colors md:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-white"
                    >
                      Correu electrònic *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="el.teu.email@exemple.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={{
                        height: "2.5rem",
                        background: "rgba(255, 255, 255, 0)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                      className="text-white placeholder-gray-300 focus:border-padel-primary transition-colors md:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="text-sm font-semibold text-white"
                    >
                      Telèfon *
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="text"
                      placeholder="+34 123 456 789"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      style={{
                        height: "2.5rem",
                        background: "rgba(255, 255, 255, 0)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                      className="text-white placeholder-gray-300 focus:border-padel-primary transition-colors md:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-semibold text-white"
                    >
                      Missatge
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Explica'ns com et podem ajudar..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className="text-white placeholder-gray-300 focus:border-padel-primary transition-colors h-20 md:h-32"
                      style={{
                        background: "rgba(255, 255, 255, 0)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        resize: "none",
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-padel-primary hover:bg-padel-primary/90 text-padel-secondary font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-padel-secondary/30 border-t-padel-secondary rounded-full animate-spin" />
                        Enviant...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Enviar missatge
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Contact Info & Stats (now using extracted components) */}
          <div className="order-1 lg:order-2 space-y-4 md:space-y-6 h-full flex flex-col hidden md:flex">
            <ContactInfoBlocks className="animate-fade-in-up" />
            <CommunityStats className="animate-fade-in-up" />
          </div>
        </div>

        {/* Mobile Accordion for Contact Info & Stats */}
  <div className="mt-8 md:hidden">
          <Accordion type="multiple" className="w-full" defaultValue={[]}>
            <AccordionItem value="info">
              <AccordionTrigger className="text-white">
                Informació de contacte
              </AccordionTrigger>
              <AccordionContent>
    <ContactInfoBlocks />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="stats">
              <AccordionTrigger className="text-white">
                La nostra comunitat
              </AccordionTrigger>
              <AccordionContent>
    <CommunityStats compact />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
