import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ConfidenceIndicatorProps {
  confidence: number;
}

export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);
  const isHigh = confidence > 0.7;
  const isMedium = confidence > 0.4 && confidence <= 0.7;
  const isLow = confidence <= 0.4;

  const getIcon = () => {
    if (isHigh) return <CheckCircle className="h-5 w-5 text-chart-2" />;
    if (isMedium) return <AlertTriangle className="h-5 w-5 text-chart-3" />;
    return <AlertCircle className="h-5 w-5 text-chart-5" />;
  };

  const getColorClass = () => {
    if (isHigh) return "text-chart-2";
    if (isMedium) return "text-chart-3";
    return "text-chart-5";
  };

  const getLabel = () => {
    if (isHigh) return "High Confidence";
    if (isMedium) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <Card data-testid="card-confidence">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {getIcon()}
          Location Confidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold ${getColorClass()}`} data-testid="text-confidence-percentage">
            {percentage}%
          </span>
        </div>
        
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" data-testid="progress-confidence" />
          <p className="text-sm text-muted-foreground" data-testid="text-confidence-label">
            {getLabel()}
          </p>
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          Analysis based on visual features, architectural patterns, and environmental markers
        </div>
      </CardContent>
    </Card>
  );
}
