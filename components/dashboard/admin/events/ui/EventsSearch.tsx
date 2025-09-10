import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface EventsSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function EventsSearch({ search, onSearchChange }: EventsSearchProps) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
          <Input
            placeholder="Cerca per títol o ubicació..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
      </CardContent>
    </Card>
  );
}