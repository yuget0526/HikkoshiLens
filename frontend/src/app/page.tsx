"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocationStore } from "@/stores/locationStore";
import { usePreferenceStore } from "@/stores/preferenceStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { MapboxService } from "@/services/mapbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import { Briefcase, ArrowRight } from "lucide-react";

// NOTE: 画面のみ（機能はモック）。住所入力→次へ の導線をUIで表現。
// 実装時はジオコーディング結果から /lines に遷移します。

export default function Home() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const weights = usePreferenceStore((state) => state.weights);
  const setWeights = usePreferenceStore((state) => state.setWeights);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleNext = async () => {
    try {
      const mapboxService = MapboxService.getInstance();
      const result = await mapboxService.searchAddress(address);
      if (result && result.features.length > 0) {
        const feature = result.features[0];
        const center = feature.center;
        console.log("ジオコーディング結果:", {
          座標: center,
          入力住所: address,
          場所名: feature.place_name,
        });
        // locationStore に保存
        useLocationStore.getState().setWorkLocation({
          lat: center[1],
          lng: center[0],
          address: address,
        });
        router.push("/lines");
      } else {
        console.error("住所が見つかりませんでした");
      }
    } catch (error) {
      console.error("ジオコーディングエラー:", error);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6 mt-16">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-6 md:grid md:grid-cols-5">
          {/* 左：フォーム */}
          <section className="md:col-span-3">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  勤務先の住所を入力
                </CardTitle>
                <CardDescription>
                  勤務先を基準に、通いやすい路線を提案します。
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">勤務先住所</Label>
                  <Input
                    id="address"
                    placeholder="例：東京都千代田区丸の内1-9-1"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    ※ いまはモックです。検索ボタンで次の画面に遷移します。
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/")}
                  >
                    リセット
                  </Button>
                  <Button onClick={handleNext} disabled={!address}>
                    路線を探す
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ヒント */}
            <div className="mt-4 text-sm text-muted-foreground">
              入力した勤務先から近い順に、最大10件の路線を表示します。
            </div>
          </section>
          {/* 右：重みづけUI（スライダー） */}
          <aside className="md:col-span-2">
            <Card className="rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-base">
                  重みづけ（オプション）
                </CardTitle>
                <CardDescription>
                  合計は気にせず配分してください。計算時は内部で自動的に正規化（合計100）されます。
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {(
                  [
                    ["access", "アクセス"],
                    ["life", "利便性"],
                    ["fun", "遊び"],
                    ["safety", "治安"],
                    ["env", "環境"],
                    ["cost", "コスパ"],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className="grid grid-cols-5 items-center gap-3"
                  >
                    <div className="col-span-1 text-sm text-muted-foreground">
                      {label}
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
                    <span className="tabular-nums">{totalWeight}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
}
