"use client";

import { memo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { nodes } from "@/lib/mockData";

// Import Leaflet CSS - using dynamic import to avoid build issues
import "leaflet/dist/leaflet.css";

interface MapNode {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: string;
  serviceLevel: number;
  waste: number;
  mape: number;
}

interface SaudiMapProps {
  onNodeClick?: (node: MapNode) => void;
}

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon based on status
const createStatusIcon = (status: string) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "#2CA02C"; // Medium Green
      case "warning":
        return "#FF7F0E"; // Orange
      case "danger":
        return "#D62728"; // Crimson Red
      default:
        return "#7F7F7F"; // Gray
    }
  };

  const color = getStatusColor(status);
  return L.divIcon({
    className: "custom-status-marker",
    html: `<div class="map-marker-pin" style="
      width: 16px;
      height: 16px;
      min-width: 16px;
      min-height: 16px;
      max-width: 16px;
      max-height: 16px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 0 2px ${color}40;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      display: block;
      visibility: visible;
      opacity: 1;
      box-sizing: border-box;
      aspect-ratio: 1 / 1;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
};

// Component to handle map centering
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "good":
      return "status-good";
    case "warning":
      return "status-warning";
    case "danger":
      return "status-danger";
    default:
      return "status-muted";
    }
  };

// Saudi Arabia center coordinates
const SAUDI_CENTER: [number, number] = [23.8859, 45.0792];
const DEFAULT_ZOOM = 6;

// Component to initialize map and ensure markers are visible
const MapInitializer = () => {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  return null;
};

export const SaudiMap = memo(function SaudiMap({ onNodeClick }: SaudiMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] lg:h-[380px] xl:h-[400px] rounded-xl overflow-hidden border border-border shadow-lg">
      <MapContainer
        center={SAUDI_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={true}
        className="rounded-xl"
        ref={mapRef}
      >
        {/* CARTO Voyager - light, colorful geographic tiles with blue water and clear borders */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapController center={SAUDI_CENTER} />
        <MapInitializer />

        {/* Node markers */}
        {nodes.map((node) => (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={createStatusIcon(node.status)}
            eventHandlers={{
              click: () => onNodeClick?.(node),
            }}
          >
            <Popup className="custom-popup" closeButton={true}>
              <div className="p-3 sm:p-4 min-w-[200px] sm:min-w-[220px] max-w-[90vw] bg-card rounded-lg">
                <div className="mb-3 pb-2 border-b border-border">
                  <p className="font-bold text-sm sm:text-base text-foreground mb-1 truncate">{node.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{node.type}</p>
                </div>
                <div className="flex flex-col gap-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/50 rounded-md border border-border/50">
                    <span className="text-muted-foreground font-medium">Service Level:</span>
                    <span className={`font-bold whitespace-nowrap ${node.serviceLevel >= 95 ? "text-success" : node.serviceLevel >= 90 ? "text-warning" : "text-destructive"}`}>
                      {node.serviceLevel}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/50 rounded-md border border-border/50">
                    <span className="text-muted-foreground font-medium">Waste:</span>
                    <span className={`font-bold whitespace-nowrap ${node.waste <= 2 ? "text-success" : node.waste <= 4 ? "text-warning" : "text-destructive"}`}>
                      {node.waste}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/50 rounded-md border border-border/50">
                    <span className="text-muted-foreground font-medium">MAPE:</span>
                    <span className={`font-bold whitespace-nowrap ${node.mape <= 5 ? "text-success" : node.mape <= 7 ? "text-warning" : "text-destructive"}`}>
                      {node.mape}%
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-card/95 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-[10px] sm:text-xs shadow-lg border border-border z-[1000]">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="status-dot status-good shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">Good</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="status-dot status-warning shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">At Risk</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="status-dot status-danger shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
});
