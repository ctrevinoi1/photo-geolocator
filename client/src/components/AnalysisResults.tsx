import { MapView } from "./MapView";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { CoordinateDisplay } from "./CoordinateDisplay";
import { VisualFeatures } from "./VisualFeatures";
import { ReasoningBreakdown } from "./ReasoningBreakdown";
import { StreetClipPredictions } from "./StreetClipPredictions";
import { MapillaryMatchCard } from "./MapillaryMatch";
import { AddressDetails } from "./AddressDetails";
import { HierarchicalPredictions } from "./HierarchicalPredictions";
import type { GeolocationAnalysis } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: GeolocationAnalysis;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="div-analysis-results">
      {/* Map Visualization */}
      <MapView
        coordinates={analysis.coordinates}
        confidence={analysis.confidence}
        locationName={analysis.locationName}
      />

      {/* Analysis Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ConfidenceIndicator confidence={analysis.confidence} />
          <CoordinateDisplay
            coordinates={analysis.coordinates}
            locationName={analysis.locationName}
            country={analysis.country}
            region={analysis.region}
          />
          {analysis.reverseGeocoding && (
            <AddressDetails reverseGeocoding={analysis.reverseGeocoding} />
          )}
          {analysis.geocellData && (
            <HierarchicalPredictions geocellData={analysis.geocellData} />
          )}
          {analysis.streetClipPredictions && (
            <StreetClipPredictions predictions={analysis.streetClipPredictions} />
          )}
          {analysis.mapillaryMatch && (
            <MapillaryMatchCard match={analysis.mapillaryMatch} />
          )}
        </div>

        <div className="space-y-6">
          <VisualFeatures features={analysis.visualFeatures} />
          <ReasoningBreakdown reasoning={analysis.reasoning} />
        </div>
      </div>
    </div>
  );
}
