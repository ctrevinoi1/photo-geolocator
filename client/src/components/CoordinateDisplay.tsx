import { useState } from "react";
import { Copy, Check, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Coordinates } from "@shared/schema";

interface CoordinateDisplayProps {
  coordinates: Coordinates;
  locationName: string;
  country?: string;
  region?: string;
}

export function CoordinateDisplay({ 
  coordinates, 
  locationName,
  country,
  region 
}: CoordinateDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!coordinates) {
    return null;
  }

  const copyToClipboard = () => {
    const coordText = `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coordText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card data-testid="card-coordinates">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Predicted Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xl font-semibold" data-testid="text-location-name">
            {locationName}
          </p>
          {(region || country) && (
            <p className="text-sm text-muted-foreground" data-testid="text-location-region">
              {[region, country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Coordinates
          </label>
          <div className="flex items-center gap-2">
            <code 
              className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm"
              data-testid="text-coordinates"
            >
              {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              data-testid="button-copy-coordinates"
            >
              {copied ? (
                <Check className="h-4 w-4 text-chart-2" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Latitude:</span>
            <p className="font-mono font-medium">{coordinates.latitude.toFixed(6)}°</p>
          </div>
          <div>
            <span className="text-muted-foreground">Longitude:</span>
            <p className="font-mono font-medium">{coordinates.longitude.toFixed(6)}°</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
