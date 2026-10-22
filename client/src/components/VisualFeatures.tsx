import { Building2, Trees, Construction, Signpost, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VisualFeature } from "@shared/schema";

interface VisualFeaturesProps {
  features: VisualFeature[];
}

const categoryIcons = {
  architecture: Building2,
  vegetation: Trees,
  infrastructure: Construction,
  signage: Signpost,
  environment: Cloud,
};

export function VisualFeatures({ features }: VisualFeaturesProps) {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-visual-features">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          Visual Features Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, index) => {
            const Icon = categoryIcons[feature.category];
            const confidencePercent = Math.round(feature.confidence * 100);

            return (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/50 space-y-2"
                data-testid={`div-feature-${feature.category}-${index}`}
              >
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded bg-background">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {feature.category}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {confidencePercent}%
                      </Badge>
                    </div>
                    <p className="text-sm leading-snug">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
