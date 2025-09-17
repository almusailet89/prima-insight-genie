// API utilities for Prima FP&A application
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface ChatRequest {
  question: string;
  context: {
    entity?: string;
    period?: string;
    department?: string;
  };
  data: any[];
}

export interface ChatResponse {
  response: string;
  narrative?: string;
  dataUsed?: any[];
  chart?: any;
}

export interface ExportPPTRequest {
  period: string;
  narrative: string;
  kpiData: any[];
  varianceData: any[];
}

export interface UploadedDataRow {
  period: string;
  entity: string;
  department: string;
  metric: string;
  actual: number;
  budget: number;
  currency: string;
}

class APIClient {
  private baseURL = '';

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);
      
      return {
        data,
        status: response.status,
        error: !response.ok ? data?.error || 'Request failed' : undefined,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { status: 408, error: 'Request timeout' };
      }
      
      return { 
        status: 0, 
        error: error.message || 'Network error' 
      };
    }
  }

  async chat(request: ChatRequest): Promise<APIResponse<ChatResponse>> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async exportPPT(request: ExportPPTRequest): Promise<APIResponse<{ downloadUrl: string }>> {
    return this.request<{ downloadUrl: string }>('/api/export/ppt', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDemoVariance(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/api/demo/variance');
  }

  async seedReset(data: UploadedDataRow[]): Promise<APIResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/api/seed/reset', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async getNetSuiteConfig(): Promise<APIResponse<any>> {
    return this.request<any>('/api/netsuite/config');
  }

  async saveNetSuiteConfig(config: any): Promise<APIResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/api/netsuite/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }
}

export const apiClient = new APIClient();