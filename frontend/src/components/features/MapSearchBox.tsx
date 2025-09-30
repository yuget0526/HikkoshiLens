"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CurrentMapRegistry } from "@/features/map/registry";
import { MapboxService } from "@/services/mapbox";
import type { FC } from "react";

export const MapSearchBox: FC = () => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = async (query: string) => {
    try {
      if (!query) return;

      const mapboxService = MapboxService.getInstance();
      const result = await mapboxService.searchAddress(query);
      if (result && result.features.length > 0) {
        const feature = result.features[0];
        const [lng, lat] = feature.center;
        const map = CurrentMapRegistry.instance;

        if (map) {
          map.flyTo({
            center: [lng, lat],
            zoom: 14,
          });
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  return (
    <div className="w-96">
      <Input
        type="text"
        placeholder="住所を入力..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch(searchValue);
          }
        }}
      />
    </div>
  );
};
