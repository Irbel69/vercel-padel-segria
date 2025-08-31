"use client";

// Card wrapper removed: Page will provide the outer Card
import { Star, Award } from "lucide-react";
import React from "react";

type QualitiesListProps = {
  userQualities: any[];
  getQualityIcon: (name: string) => any;
};

export default function QualitiesList({ userQualities, getQualityIcon }: QualitiesListProps) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-padel-primary" />
        Qualitats Destacades
      </h3>

      {userQualities && userQualities.length > 0 ? (
        <div className="flex items-center justify-around">
          {userQualities.map((uq: any) => {
            const IconComponent = getQualityIcon(uq.qualities.name);
            return (
              <div key={uq.quality_id} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-padel-primary/20 to-padel-primary/30 flex items-center justify-center border border-padel-primary/40">
                  <IconComponent className="w-6 h-6 text-padel-primary" />
                </div>
                <span className="text-white text-xs font-medium text-center mt-2 max-w-16 leading-tight">
                  {uq.qualities.name}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <Award className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <div className="text-white/60 text-sm mb-1">Cap qualitat assignada</div>
          <div className="text-xs text-white/40">Un admin pot assignar-te fins a 3</div>
        </div>
      )}
    </div>
  );
}
