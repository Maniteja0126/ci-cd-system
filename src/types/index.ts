export interface Config {
    project: {
      type: 'nextjs' | 'node' | 'rust';
      config?: any;
    };
    provider: {
      type: 'aws';
      config?: any;
    };
    environment: 'dev' | 'staging' | 'prod';
    steps: string[];
    env?: Record<string, string>;
}
  
export interface ActionConfig {
    name: string;
    config?: any;
}
  
export interface ProjectConfig {
    type: string;
    config?: any;
}
  
export interface ProviderConfig {
    type: string;
    config?: any;
}