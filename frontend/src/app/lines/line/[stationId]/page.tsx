"use client";

import { useSearchParams } from "next/navigation";
import MapDefault from "@/components/features/MapDefault";
import { MapHeader } from "@/components/features/MapHeader";

// 画面のみ。/stations/[stationId]?work=lat,lng を想定。
// Mapbox領域はプレースホルダ。イソクロン/医療施設のUIだけ用意。

import { useUiStore } from "@/stores/uiStore";

import { useEffect, useState, use } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

export default function StationDetailPage({
  params,
}: {
  params: Promise<{ stationId: string }>;
}) {
  const { stationId } = use(params);
  const sp = useSearchParams();
  const work = sp.get("work") ?? "";
  const coordinates = sp.get("coordinates");
  // Mapboxのcenterは [lng, lat] なので初期値も [lng, lat]
  const [center, setCenter] = useState<[number, number]>([
    136.28986425, 35.31435525,
  ]);
  const [stationName, setStationName] = useState<string>("駅");
  // const [lineId, setLineId] = useState<string>(""); // 必要ならAPIから取得

  useEffect(() => {
    if (coordinates) {
      const [lat, lng] = coordinates.split(",").map(Number);
      if (lat && lng) {
        setCenter([lng, lat]);
      }
      return;
    }
    if (!stationId) return;
    const url = `http://localhost:8000/api/stations/get_coordinates_by_stationid?station_id=${encodeURIComponent(
      stationId
    )}`;
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("駅データの取得に失敗しました");
        return response.json();
      })
      .then((data) => {
        if (data?.coordinates) {
          setCenter([data.coordinates.lng, data.coordinates.lat]);
        }
        // 駅名もAPIで取得できる場合はここでsetStationName(data.name)など
      })
      .catch((error) => {
        console.error("Error fetching station coordinates:", error);
      });
  }, [stationId, coordinates]);

  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map 全画面 */}
      <div className="absolute inset-0">
        <div className="map-container absolute inset-0 grid place-items-center text-muted-foreground">
          <MapDefault center={center} />
        </div>
      </div>

      {/* 上部ヘッダー（MapHeader を使用）*/}
      <div className="absolute top-0 left-0 right-0 z-30">
        <MapHeader
          title={`${stationName} 駅周辺`}
          items={[
            { label: "Home", href: `/${work ? `?work=${work}` : ""}` },
            { label: "Lines", href: `/lines${work ? `?work=${work}` : ""}` },
            // { label: "Line", href: `/lines/${lineId}${work ? `?work=${work}` : ""}` },
            { label: "Station", current: true },
          ]}
          onBack={() => history.back()}
        />
      </div>

      {/* サイドバー（操作ボード）*/}
      <aside
        className={`absolute z-30 top-34 right-4 transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-[-110%]"
        }`}
      ></aside>
    </div>
  );
}
