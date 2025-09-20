"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapModalProps {
  origin: string;
  destination: string;
  onClose: () => void;
}

export function MapModal({ origin, destination, onClose }: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const [mapInfo, setMapInfo] = useState("Loading route...");

  // Initialize map once on component mount
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView([0, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(leafletMapRef.current);
    }

    return () => {
      // Clean up map when component unmounts
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update route when origin or destination changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Invalidate map size to fix rendering issues after modal opens
    map.invalidateSize();

    const geocodeNominatim = async (address: string) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const results = await response.json();
      if (results && results.length > 0) {
        return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
      } else {
        throw new Error("No results");
      }
    };

    const showRoute = async () => {
      setMapInfo("Loading route...");
      try {
        const [originCoord, destCoord] = await Promise.all([
          geocodeNominatim(origin),
          geocodeNominatim(destination),
        ]);

        map.setView(originCoord as L.LatLngExpression, 7);

        // Clear previous route
        if (routeLayerRef.current) {
          map.removeLayer(routeLayerRef.current);
        }

        // Route with OSRM
        const osrmResponse = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${originCoord[1]},${originCoord[0]};${destCoord[1]},${destCoord[0]}?overview=full&geometries=geojson`
        );
        const osrmData = await osrmResponse.json();

        if (osrmData.routes && osrmData.routes.length > 0) {
          const route = osrmData.routes[0];
          routeLayerRef.current = L.geoJSON(route.geometry).addTo(map);
          map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
          const distKm = (route.distance / 1000).toFixed(2);
          const durationMin = Math.round(route.duration / 60);
          setMapInfo(
            `<strong>Distance:</strong> ${distKm} km<br><strong>Estimated Time:</strong> ${durationMin} min`
          );
        } else {
          setMapInfo("No route found.");
        }

        // Markers
        L.marker(originCoord as L.LatLngExpression).addTo(map).bindPopup("Origin").openPopup();
        L.marker(destCoord as L.LatLngExpression).addTo(map).bindPopup("Destination");
      } catch (error) {
        setMapInfo(`Error: ${(error as Error).message}`);
      }
    };

    showRoute();
  }, [origin, destination]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="relative w-[90vw] max-w-[600px] h-[70vh] bg-white rounded-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 bg-gray-200 rounded-full"
        >
          Close
        </button>
        <div ref={mapRef} className="w-full h-full"></div>
        <div
          className="absolute bottom-2 left-2 bg-white bg-opacity-90 p-2 rounded-md z-10"
          dangerouslySetInnerHTML={{ __html: mapInfo }}
        ></div>
      </div>
    </div>
  );
}
