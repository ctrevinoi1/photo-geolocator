import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, MapPin, Map, Building2 } from "lucide-react";
import type { GeocellData } from "@shared/schema";

interface HierarchicalPredictionsProps {
  geocellData: GeocellData;
}

const levelIcons = {
  continent: Globe,
  country: MapPin,
  region: Map,
  city: Building2,
};

const levelLabels = {
  continent: "Continent",
  country: "Country",
  region: "Region/State",
  city: "City",
};

export function HierarchicalPredictions({ geocellData }: HierarchicalPredictionsProps) {
  const { hierarchicalPredictions, primaryGeohash } = geocellData;

  if (!hierarchicalPredictions || hierarchicalPredictions.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-hierarchical-predictions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Hierarchical Location Analysis
        </CardTitle>
        <CardDescription>
          Progressive refinement from broad regions to specific locations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hierarchicalPredictions.map((prediction) => {
          const Icon = levelIcons[prediction.level as keyof typeof levelIcons];
          const label = levelLabels[prediction.level as keyof typeof levelLabels];
          const confidencePercent = Math.round(prediction.confidence * 100);

          return (
            <div
              key={prediction.level}
              className="space-y-2"
              data-testid={`div-prediction-${prediction.level}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <Badge variant="secondary" data-testid={`badge-confidence-${prediction.level}`}>
                  {confidencePercent}%
                </Badge>
              </div>
              <div className="pl-6">
                <p className="text-sm font-semibold mb-1" data-testid={`text-prediction-${prediction.level}`}>
                  {prediction.prediction}
                </p>
                <Progress value={confidencePercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Geohash: <code className="bg-muted px-1 rounded">{prediction.geohash}</code>
                </p>
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Primary Geohash (Street-level):</p>
            <code className="bg-muted px-2 py-1 rounded block" data-testid="text-primary-geohash">
              {primaryGeohash}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
