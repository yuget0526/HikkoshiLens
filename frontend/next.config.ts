import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker用の設定
  output: "standalone",

  // 環境変数の設定
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    // MLIT APIキーはユースケースに応じて残しています（現在は未使用）
    NEXT_PUBLIC_MLIT_API_KEY: process.env.NEXT_PUBLIC_MLIT_API_KEY,
  },

  // 画像の最適化設定
  images: {
    domains: ["localhost"],
  },
};

export default nextConfig;
