export interface ClusterMetric {
  cluster: string;
  region: string;
  nodes: number;
  ramUsage: number;
  cpuUsage: number;
  lastUpdated: Date;
}

export interface ErrorDistributionData {
  namespace: string;
  cluster: string;
  region: string;
  errors24h: number;
  errorRate24h: number;
  errors48h: number;
  errorRate48h: number;
  errors72h: number;
  errorRate72h: number;
}

export class MetricsService {
  private readonly VICTORIA_METRICS_URL = "https://ds.groundcover.com/datasources/prometheus/api/v1/query_range";
  private readonly CLICKHOUSE_URL = "https://ds.groundcover.com/";

  constructor(private dataApiKey: string) {}

  async fetchClusterMetrics(clusters: string[]): Promise<ClusterMetric[]> {
    const metrics: ClusterMetric[] = [];

    for (const cluster of clusters) {
      try {
        const [nodes, ramUsage, cpuUsage] = await Promise.all([
          this.fetchNodes(cluster),
          this.fetchRAMUsage(cluster),
          this.fetchCPUUsage(cluster)
        ]);

        metrics.push({
          cluster,
          region: this.getRegion(cluster),
          nodes,
          ramUsage,
          cpuUsage,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error(`Error fetching metrics for cluster ${cluster}:`, error);
        
        // Add cluster with zero values if fetch fails
        metrics.push({
          cluster,
          region: this.getRegion(cluster),
          nodes: 0,
          ramUsage: 0,
          cpuUsage: 0,
          lastUpdated: new Date()
        });
      }
    }

    return metrics;
  }

  async fetchErrorDistribution(clusters: string[], namespaces: string[]): Promise<ErrorDistributionData[]> {
    const errorData: ErrorDistributionData[] = [];

    for (const cluster of clusters) {
      try {
        const clusterErrors = await this.fetchClusterErrorDistribution(cluster, namespaces);
        errorData.push(...clusterErrors);
      } catch (error) {
        console.error(`Error fetching error distribution for cluster ${cluster}:`, error);
      }
    }

    return errorData;
  }

  async detectClusters(): Promise<string[]> {
    const query = "SELECT DISTINCT cluster FROM logs WHERE timestamp > NOW() - INTERVAL 1440 MINUTE FORMAT JSON";
    const allowedClusters = new Set([
      "ws-use1-gigaspaces-net",
      "erag-c1-gigaspaces-net", 
      "ws-euc1-gigaspaces-net",
      "erag-dev-gigaspaces-net",
      "mercury-gigaspaces-net"
    ]);

    try {
      const response = await fetch(this.CLICKHOUSE_URL, {
        method: 'POST',
        headers: {
          'X-ClickHouse-Key': this.dataApiKey,
          'Content-Type': 'text/plain'
        },
        body: query
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data?.data) {
        const clusters = data.data
          .map((item: any) => item.cluster)
          .filter((cluster: string) => cluster && allowedClusters.has(cluster));
        
        return clusters;
      }

      return [];
    } catch (error) {
      console.error('Error detecting clusters:', error);
      return [];
    }
  }

  private async fetchNodes(cluster: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const start = now - (24 * 3600);
    
    const query = `count(count by (node_name) (groundcover_node_rt_m_cpu_usage{cluster="${cluster}"}))`;
    
    try {
      const response = await this.queryVictoriaMetrics(query, start, now);
      
      if (response?.data?.result?.[0]?.values?.length > 0) {
        const lastValue = response.data.result[0].values[response.data.result[0].values.length - 1];
        return parseFloat(lastValue[1]) || 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error fetching nodes for ${cluster}:`, error);
      return 0;
    }
  }

  private async fetchRAMUsage(cluster: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const start = now - (24 * 3600);
    
    const query = `avg by (cluster) (groundcover_node_mem_used_percent{cluster="${cluster}"})`;
    
    try {
      const response = await this.queryVictoriaMetrics(query, start, now);
      
      if (response?.data?.result?.[0]?.values?.length > 0) {
        const lastValue = response.data.result[0].values[response.data.result[0].values.length - 1];
        return parseFloat(lastValue[1]) || 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error fetching RAM for ${cluster}:`, error);
      return 0;
    }
  }

  private async fetchCPUUsage(cluster: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const start = now - (24 * 3600);
    
    const query = `(sum by (cluster) (rate(groundcover_node_m_cpu_usage_seconds_total{cluster="${cluster}"}[5m])) / sum by (cluster) (groundcover_node_capacity_cpum_cpu{cluster="${cluster}"})) * 100`;
    
    try {
      const response = await this.queryVictoriaMetrics(query, start, now);
      
      if (response?.data?.result?.[0]?.values?.length > 0) {
        const lastValue = response.data.result[0].values[response.data.result[0].values.length - 1];
        return parseFloat(lastValue[1]) || 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error fetching CPU for ${cluster}:`, error);
      return 0;
    }
  }

  private async queryVictoriaMetrics(query: string, start: number, end: number): Promise<any> {
    const params = new URLSearchParams({
      query,
      start: start.toString(),
      end: end.toString(),
      step: '5m'
    });

    const response = await fetch(`${this.VICTORIA_METRICS_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.dataApiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Victoria Metrics API error: ${response.status}`);
    }

    return response.json();
  }

  private async fetchClusterErrorDistribution(cluster: string, namespaces: string[]): Promise<ErrorDistributionData[]> {
    if (namespaces.length === 0) return [];

    const namespacesFilter = namespaces.map(ns => `'${ns}'`).join(',');
    
    const query = `
      WITH TotalCounts_24h AS (
        SELECT
          namespace,
          cluster,
          COUNT() AS total_count_24h
        FROM logs
        WHERE timestamp > NOW() - INTERVAL 1440 MINUTE
          AND cluster = '${cluster}'
        GROUP BY namespace, cluster
      ),
      ErrorCounts_24h AS (
        SELECT
          namespace,
          cluster,
          COUNT() AS error_count_24h
        FROM logs
        WHERE level = 'error'
          AND timestamp > NOW() - INTERVAL 1440 MINUTE
          AND cluster = '${cluster}'
          AND content IS NOT NULL
          AND content != ''
        GROUP BY namespace, cluster
      ),
      TotalCounts_48h AS (
        SELECT
          namespace,
          cluster,
          COUNT() AS total_count_48h
        FROM logs
        WHERE timestamp > NOW() - INTERVAL 2880 MINUTE
          AND cluster = '${cluster}'
        GROUP BY namespace, cluster
      ),
      ErrorCounts_48h AS (
        SELECT
          namespace,
          cluster,
          COUNT() AS error_count_48h
        FROM logs
        WHERE level = 'error'
          AND timestamp > NOW() - INTERVAL 2880 MINUTE
          AND cluster = '${cluster}'
          AND content IS NOT NULL
          AND content != ''
        GROUP BY namespace, cluster
      ),
      TotalCounts_72h AS (
        SELECT
          namespace,
          cluster,
          COUNT() AS total_count_72h
        FROM logs
        WHERE timestamp > NOW() - INTERVAL 4320 MINUTE
          AND cluster = '${cluster}'
        GROUP BY namespace, cluster
      ),
      ErrorCounts_72h AS (
        SELECT
          namespace,
          cluster,
          COUNT() AS error_count_72h
        FROM logs
        WHERE level = 'error'
          AND timestamp > NOW() - INTERVAL 4320 MINUTE
          AND cluster = '${cluster}'
          AND content IS NOT NULL
          AND content != ''
        GROUP BY namespace, cluster
      )
      SELECT
        t24.namespace AS namespace,
        t24.cluster AS cluster,
        COALESCE(e24.error_count_24h, 0) AS error_count_24h,
        t24.total_count_24h AS total_count_24h,
        ROUND((COALESCE(e24.error_count_24h, 0) / t24.total_count_24h) * 100, 2) AS error_rate_24h,
        COALESCE(e48.error_count_48h, 0) AS error_count_48h,
        t48.total_count_48h AS total_count_48h,
        ROUND((COALESCE(e48.error_count_48h, 0) / t48.total_count_48h) * 100, 2) AS error_rate_48h,
        COALESCE(e72.error_count_72h, 0) AS error_count_72h,
        t72.total_count_72h AS total_count_72h,
        ROUND((COALESCE(e72.error_count_72h, 0) / t72.total_count_72h) * 100, 2) AS error_rate_72h
      FROM TotalCounts_24h t24
      LEFT JOIN ErrorCounts_24h e24 ON t24.namespace = e24.namespace AND t24.cluster = e24.cluster
      LEFT JOIN TotalCounts_48h t48 ON t24.namespace = t48.namespace AND t24.cluster = t48.cluster
      LEFT JOIN ErrorCounts_48h e48 ON t24.namespace = e48.namespace AND t24.cluster = e48.cluster
      LEFT JOIN TotalCounts_72h t72 ON t24.namespace = t72.namespace AND t24.cluster = t72.cluster
      LEFT JOIN ErrorCounts_72h e72 ON t24.namespace = e72.namespace AND t24.cluster = e72.cluster
      WHERE t24.total_count_24h > 0
        AND t24.namespace IN (${namespacesFilter})
      ORDER BY error_rate_24h DESC
      FORMAT JSON
    `;

    try {
      const response = await fetch(this.CLICKHOUSE_URL, {
        method: 'POST',
        headers: {
          'X-ClickHouse-Key': this.dataApiKey,
          'Content-Type': 'text/plain'
        },
        body: query
      });

      if (!response.ok) {
        throw new Error(`ClickHouse API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.data) {
        return data.data.map((row: any) => ({
          namespace: row.namespace,
          cluster: row.cluster,
          region: this.getRegion(row.cluster),
          errors24h: row.error_count_24h,
          errorRate24h: row.error_rate_24h,
          errors48h: row.error_count_48h,
          errorRate48h: row.error_rate_48h,
          errors72h: row.error_count_72h,
          errorRate72h: row.error_rate_72h
        }));
      }

      return [];
    } catch (error) {
      console.error(`Error fetching error distribution for ${cluster}:`, error);
      return [];
    }
  }

  private getRegion(cluster: string): string {
    if (cluster.includes('erag-c1')) return 'US';
    if (cluster.includes('euc1')) return 'EU';
    if (cluster.includes('use1')) return 'US-EAST';
    if (cluster.includes('erag-dev')) return 'DEV';
    if (cluster.includes('mercury')) return 'MERCURY';
    return 'N/A';
  }
}