import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 必要なパラメータを取得
    const response_format = searchParams.get("response_format") || "geojson";
    const z = searchParams.get("z");
    const x = searchParams.get("x");
    const y = searchParams.get("y");
    const administrativeAreaCode = searchParams.get("administrativeAreaCode");

    // パラメータの検証
    if (!z || !x || !y) {
      return NextResponse.json(
        { error: "Missing required parameters: z, x, y" },
        { status: 400 }
      );
    }

    // 国土交通省APIのURLを構築
    const mlitUrl = new URL(
      "https://www.reinfolib.mlit.go.jp/ex-api/external/XKT031"
    );
    mlitUrl.searchParams.append("response_format", response_format);
    mlitUrl.searchParams.append("z", z);
    mlitUrl.searchParams.append("x", x);
    mlitUrl.searchParams.append("y", y);

    if (administrativeAreaCode) {
      mlitUrl.searchParams.append(
        "administrativeAreaCode",
        administrativeAreaCode
      );
    }

    console.log("Proxying request to:", mlitUrl.toString());

    // 国土交通省APIにリクエスト
    const mlitResponse = await fetch(mlitUrl.toString(), {
      headers: {
        "User-Agent": "Hikkoshilens/1.0",
        Accept: "application/json, application/geo+json",
      },
    });

    if (!mlitResponse.ok) {
      console.error(
        "MLIT API error:",
        mlitResponse.status,
        mlitResponse.statusText
      );
      return NextResponse.json(
        {
          error: `MLIT API error: ${mlitResponse.status} ${mlitResponse.statusText}`,
        },
        { status: mlitResponse.status }
      );
    }

    const data = await mlitResponse.json();

    // CORSヘッダーを追加してレスポンス
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
