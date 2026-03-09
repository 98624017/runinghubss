"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Repeat, Layers, Home, Sparkles, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  palette: Palette,
  repeat: Repeat,
  layers: Layers,
  home: Home,
  sparkles: Sparkles,
};

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export function AppCard({ id, name, description, icon }: AppCardProps) {
  const Icon = iconMap[icon] || Sparkles;

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription>{description}</CardDescription>
        <Link href={`/workspace/${id}`}>
          <Button className="w-full gap-2 group-hover:gap-3 transition-all">
            开始使用
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
