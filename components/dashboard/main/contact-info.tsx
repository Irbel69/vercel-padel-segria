"use client";

// Card wrapper removed: Page will provide the outer Card
import { Mail, Phone, User } from "lucide-react";
import React from "react";

type ContactInfoProps = {
  userProfile: any;
};

export default function ContactInfo({ userProfile }: ContactInfoProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-4 p-4 px-0">
        <h4 className="text-white font-medium flex items-center gap-2">
          <User className="w-5 h-5 text-padel-primary" />
          Informació de Contacte
        </h4>
        <div className="grid gap-4">
          <div className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)", border: "1px solid rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 flex items-center justify-center border border-blue-400/30">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
              <div className="flex-1">
                <div className="text-blue-300 text-sm font-medium mb-1">Correu electrònic</div>
                <div className="text-white font-medium text-lg">{userProfile.email}</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {userProfile.phone && (
            <div className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)", border: "1px solid rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/30 flex items-center justify-center border border-green-400/30">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-green-300 text-sm font-medium mb-1">Telèfon</div>
                  <div className="text-white font-medium text-lg">{userProfile.phone}</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
