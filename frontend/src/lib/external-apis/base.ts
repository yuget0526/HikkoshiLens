/**
 * 外部APIクライアントの基盤クラス
 * 共通のエラーハンドリング、リトライ、レート制限などを提供
 */

export class ExternalApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
    public apiName: string
  ) {
    super(`${apiName} API Error: ${status} ${statusText}`);
    this.name = "ExternalApiError";
  }
}

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
}

export abstract class BaseExternalApiClient {
  protected config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000,
      retryCount: 3,
      ...config,
    };
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // endpointが完全なURLの場合はそのまま使用、そうでなければbaseUrlと結合
    const url = endpoint.startsWith("http")
      ? endpoint
      : new URL(endpoint, this.config.baseUrl).toString();

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.config.defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout!),
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.retryCount!; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ExternalApiError(
            response.status,
            response.statusText,
            errorData,
            this.constructor.name
          );
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.retryCount) {
          throw lastError;
        }

        // 指数バックオフでリトライ
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    throw lastError!;
  }

  protected buildUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }
}
