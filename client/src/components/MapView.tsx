import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import type { Coordinates } from "@shared/schema";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapViewProps {
  coordinates: Coordinates;
  confidence: number;
  locationName: string;
}

export function MapView({ coordinates, confidence, locationName }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !coordinates) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [coordinates.latitude, coordinates.longitude],
        12
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      // Update existing map
      mapRef.current.setView([coordinates.latitude, coordinates.longitude], 12);
    }

    // Clear existing layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add marker with pulsing animation
    const marker = L.marker([coordinates.latitude, coordinates.longitude])
      .addTo(mapRef.current)
      .bindPopup(`<strong>${locationName}</strong><br/>Confidence: ${(confidence * 100).toFixed(1)}%`);

    // Add confidence radius (larger radius for lower confidence)
    const radiusKm = (1 - confidence) * 50 + 2; // 2-52km based on confidence
    const circle = L.circle([coordinates.latitude, coordinates.longitude], {
      color: confidence > 0.7 ? "#22c55e" : confidence > 0.4 ? "#f59e0b" : "#ef4444",
      fillColor: confidence > 0.7 ? "#22c55e" : confidence > 0.4 ? "#f59e0b" : "#ef4444",
      fillOpacity: 0.15,
      radius: radiusKm * 1000,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coordinates, confidence, locationName]);

  return (
    <Card className="overflow-hidden" data-testid="card-map">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[600px]"
        data-testid="div-map-container"
      />
    </Card>
  );
}
