"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useLocationStore } from "@/stores/locationStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Train, ArrowRight } from "lucide-react";
import {
  fetchNearbyStations,
  groupStationsByLine,
} from "@/services/station/api";
import { Line } from "@/types/station";
import { useLineStore } from "@/stores/lineStore";

// 画面のみ（データはモック）。
// work=lat,lng を受け取り、勤務先に近い順で路線（最大10件）を表示。

export default function Lines() {
  const router = useRouter();
  const workLocation = useLocationStore((state) => state.workLocation);

  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workLocation) {
      router.push("/");
      return;
    }

    const loadNearbyStations = async () => {
      try {
        const stations = await fetchNearbyStations(
          workLocation.lat,
          workLocation.lng
        );
        const groupedLines = groupStationsByLine(stations);
        setLines(groupedLines);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "駅情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadNearbyStations();
  }, [workLocation]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-4 grid gap-4 min-h-[calc(100vh-4rem)] mt-16">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Lines</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">対象路線（勤務先に近い順）</h1>
          <p className="text-sm text-muted-foreground">
            最大10件を表示します。距離は勤務先からの最短距離の目安です。
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : lines.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          周辺に路線が見つかりませんでした
        </div>
      ) : (
        <Card className="rounded-2xl flex flex-col max-h-[calc(100vh-16rem)]">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-base">路線候補</CardTitle>
            <CardDescription>
              勤務先:{" "}
              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                {workLocation?.address || "(未設定)"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <ul className="divide-y">
              {lines.map((line, i) => (
                <li key={line.id} className="py-3 flex items-center gap-4">
                  <div className="w-8 text-sm text-muted-foreground tabular-nums">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Train className="h-5 w-5" />
                        <span className="font-medium text-lg">
                          {line.stations[0].name}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm text-muted-foreground">
                        <span>{line.line_name}</span>
                        <span className="text-xs">{line.company}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="tabular-nums text-base px-3 py-1"
                    >
                      {(line.stations[0]?.distance_km ?? 0).toFixed(1)} km
                    </Badge>
                    <Button
                      onClick={() => {
                        // 路線詳細ページに遷移
                        router.push(
                          `/lines/line/?lineName=${line.line_name}&company=${line.company}`
                        );
                      }}
                    >
                      この路線を見る <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
