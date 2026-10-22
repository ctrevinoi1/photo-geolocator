import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import type { StreetClipPrediction } from "@shared/schema";

interface StreetClipPredictionsProps {
  predictions: StreetClipPrediction[];
}

export function StreetClipPredictions({ predictions }: StreetClipPredictionsProps) {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-streetclip-predictions">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Country Predictions</CardTitle>
        <Globe className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          AI model predictions based on visual patterns
        </p>
        <div className="space-y-2">
          {predictions.map((prediction, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3"
              data-testid={`div-prediction-${index}`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge
                  variant={index === 0 ? "default" : "secondary"}
                  className="shrink-0"
                  data-testid={`badge-rank-${index}`}
                >
                  #{index + 1}
                </Badge>
                <span className="text-sm font-medium truncate" data-testid={`text-country-${index}`}>
                  {prediction.country}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${prediction.confidence * 100}%` }}
                    data-testid={`div-confidence-bar-${index}`}
                  />
                </div>
                <span className="text-sm font-mono text-muted-foreground w-12 text-right" data-testid={`text-confidence-${index}`}>
                  {Math.round(prediction.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
