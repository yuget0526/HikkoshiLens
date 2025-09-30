"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  usePreferenceStore,
  WeightKey,
  WEIGHT_KEYS,
} from "@/stores/preferenceStore";
import { useLocationStore } from "@/stores/locationStore";

type ApiStation = {
  station_code: string;
  name: string;
  line_name: string;
  company: string;
  coordinates: {
    lat: number;
    lng: number;
    lon?: number;
  };
};

type ScoredStation = ApiStation & {
  stationId: string;
  scores: Record<WeightKey, number>;
  score: number;
};

function LineDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lineName = searchParams.get("lineName");
  const company = searchParams.get("company");
  const workLocation = useLocationStore((state) => state.workLocation);
  const weights = usePreferenceStore((state) => state.weights);
  const setWeights = usePreferenceStore((state) => state.setWeights);

  const [stations, setStations] = useState<ApiStation[]>([]);

  // 勤務地が未設定の場合はTOPページにリダイレクト
  useEffect(() => {
    if (!workLocation) {
      router.push("/");
      return;
    }
  }, [workLocation, router]);

  // 駅データを取得
  useEffect(() => {
    if (!lineName || !company) return;
    const url = `http://localhost:8000/api/stations/get_stations_by_line_and_company?line_name=${encodeURIComponent(
      lineName
    )}&company=${encodeURIComponent(company)}`;
    console.log("APIリクエストURL:", url);
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("駅データの取得に失敗しました");
        return response.json();
      })
      .then((data) => {
        setStations(data.stations || []);
      })
      .catch((error) => {
        console.error("Error fetching stations:", error);
        setStations([]); // エラー時に空配列を設定
      });
  }, [lineName, company]);

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
            <BreadcrumbPage>Line</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">駅ランキング</h1>
          <p className="text-sm text-muted-foreground">
            勤務先に近い駅を表示します。
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* 駅ランキング */}
        <section className="md:col-span-3">
          <Card className="rounded-2xl flex flex-col max-h-[calc(100vh-16rem)]">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-base">駅ランキング</CardTitle>
              <CardDescription>
                勤務先:{" "}
                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                  {workLocation?.address || "(未設定)"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <ul className="divide-y">
                {stations.length > 0 ? (
                  stations.map((station, i) => (
                    <li
                      key={station.station_code}
                      className="py-3 flex items-center gap-4"
                    >
                      <div className="w-8 text-sm text-muted-foreground tabular-nums">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{station.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {station.company} - {station.line_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/lines/line/${station.station_code}`)
                          }
                        >
                          詳細
                        </Button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-3 text-center text-muted-foreground">
                    駅データがありません。
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </section>
        {/* 重み調整 */}
        <section className="md:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">重み調整</CardTitle>
              <CardDescription>
                合計は気にせず配分してください（計算時に自動正規化）。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {WEIGHT_KEYS.map((key) => (
                <div key={key} className="grid grid-cols-5 items-center gap-3">
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {key === "access" && "アクセス"}
                    {key === "life" && "利便性"}
                    {key === "fun" && "遊び"}
                    {key === "safety" && "治安"}
                    {key === "env" && "環境"}
                    {key === "cost" && "コスパ"}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={weights[key]}
                      onChange={(e) => {
                        const newWeights = {
                          ...weights,
                          [key]: Number(e.target.value),
                        };
                        setWeights(newWeights);
                      }}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className="col-span-1 text-right tabular-nums text-sm">
                    {weights[key]}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="text-xs text-muted-foreground grid gap-1">
                <div>
                  現在の合計:{" "}
                  <span className="tabular-nums">
                    {Object.values(weights).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return <LineDetailContent />;
}
