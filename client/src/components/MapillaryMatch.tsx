import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, ExternalLink } from "lucide-react";
import type { MapillaryMatch } from "@shared/schema";

interface MapillaryMatchProps {
  match: MapillaryMatch;
}

export function MapillaryMatchCard({ match }: MapillaryMatchProps) {
  // Determine confidence level based on similarity score
  const getConfidenceLevel = (score: number): { label: string; variant: "default" | "secondary" | "destructive" } => {
    if (score >= 0.85) return { label: "Very High", variant: "default" };
    if (score >= 0.75) return { label: "High", variant: "default" };
    if (score >= 0.70) return { label: "Moderate", variant: "secondary" };
    return { label: "Low", variant: "destructive" };
  };

  const confidence = getConfidenceLevel(match.similarityScore);

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  return (
    <Card data-testid="card-mapillary-match">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Visual Place Recognition</CardTitle>
        <MapPin className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Location refined using street-level imagery match
        </p>

        {/* Similarity Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Match Similarity</span>
            <div className="flex items-center gap-2">
              <Badge variant={confidence.variant} data-testid="badge-confidence">
                {confidence.label}
              </Badge>
              <span className="text-sm font-mono" data-testid="text-similarity-score">
                {Math.round(match.similarityScore * 100)}%
              </span>
            </div>
          </div>
          <Progress 
            value={match.similarityScore * 100} 
            className="h-2"
            data-testid="progress-similarity"
          />
        </div>

        {/* Refinement Distance */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Refinement Distance</span>
          <span className="text-sm font-mono text-muted-foreground" data-testid="text-distance">
            {formatDistance(match.distanceMeters)}
          </span>
        </div>

        {/* Matched Coordinates */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Matched Location
          </span>
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono" data-testid="text-matched-coordinates">
              {match.matchedCoordinates.latitude.toFixed(6)}, {match.matchedCoordinates.longitude.toFixed(6)}
            </code>
          </div>
        </div>

        {/* View on Mapillary Link */}
        <a
          href={match.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline transition-colors"
          data-testid="link-mapillary"
        >
          <ExternalLink className="h-3 w-3" />
          View on Mapillary
        </a>

        {/* Info Note */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          This prediction was refined by finding visually similar street-level imagery from Mapillary's database of 2B+ images.
        </p>
      </CardContent>
    </Card>
  );
}
