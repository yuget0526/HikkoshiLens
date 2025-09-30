import type { Station } from "@/types/station";
import api from "@/lib/api-client";

export async function fetchNearbyStations(
  lat: number,
  lon: number,
  radius: number = 2
): Promise<Station[]> {
  try {
    return await api.stations.nearby({ lat, lon, radius });
  } catch (error) {
    console.error("Error fetching nearby stations:", error);
    return [];
  }
}

// 路線ごとにグループ化する関数
export function groupStationsByLine(stations: Station[]) {
  const lineMap = new Map<string, Station[]>();

  stations.forEach((station) => {
    const key = `${station.company}-${station.line_name}`;
    if (!lineMap.has(key)) {
      lineMap.set(key, []);
    }
    lineMap.get(key)?.push(station);
  });

  // 各路線の最寄り駅の距離でソート
  return Array.from(lineMap.entries())
    .map(([key, stations]) => ({
      id: key,
      company: stations[0].company,
      line_name: stations[0].line_name,
      stations: stations.sort(
        (a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0)
      ),
    }))
    .sort(
      (a, b) =>
        (a.stations[0]?.distance_km ?? 0) - (b.stations[0]?.distance_km ?? 0)
    )
    .slice(0, 10); // 最大10件に制限
}
