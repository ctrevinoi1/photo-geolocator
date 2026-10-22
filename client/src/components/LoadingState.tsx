import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingState() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" data-testid="div-loading-state">
      {/* Map Skeleton */}
      <Card className="overflow-hidden">
        <div className="w-full h-[600px] bg-muted animate-pulse flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="space-y-1">
              <p className="text-lg font-medium">Analyzing Image...</p>
              <p className="text-sm text-muted-foreground">
                Extracting visual features and determining location
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Details Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                <div className="h-24 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                <div className="h-32 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
