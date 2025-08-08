import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Config } from './types';
import { NodeProject } from './projects/NodeProject';
import { RustProject } from './projects/RustProject';
import { AwsProvider } from './providers/AwsProvider';
import { LintAction } from './actions/LintAction';
import { BuildAction } from './actions/BuildAction';
import { DeployAction } from './actions/DeployAction';

class CICDSystem {
    private config: Config;

    constructor(configPath: string = 'config.yml') {
        this.config = this.loadConfig(configPath);
        this.setupDynamicEnvironmentVariables();
    }

    private loadConfig(configPath: string): Config {
        try {
            const fileContents = fs.readFileSync(configPath, 'utf-8');
            return yaml.load(fileContents) as Config;
        } catch (error) {
            throw new Error(`Failed to load config from ${configPath}: ${error}`);
        }
    }

    private setupDynamicEnvironmentVariables(): void {
        console.log('🔧 Setting up dynamic environment variables...');
        
        process.env.NODE_ENV = process.env.NODE_ENV || 'production';
        process.env.CONFIG_PATH = process.env.CONFIG_PATH || 'config.yml';
        process.env.DEPLOY_ENV = process.env.DEPLOY_ENV || 'dev';
        
        const environment = process.env.DEPLOY_ENV || 'dev';
        console.log(`🌍 Environment: ${environment}`);
        
        if (this.config.env) {
            console.log('🔗 Processing environment variables from config...');
            Object.keys(this.config.env).forEach(key => {
                let value = this.config?.env?.[key];
                
                if (typeof value === 'string' && value.includes('${')) {
                    value = this.substituteEnvironmentVariables(value);
                }
                
                const envSpecificKey = `${environment}_${key}`;
                const envValue = process.env[key] || process.env[envSpecificKey];
                
                if (envValue) {
                    console.log(`✅ ${key}: Loaded from environment (${this.maskSensitiveData(envValue)})`);
                    process.env[key] = envValue;
                } else if (value && value !== '') {
                    console.log(`✅ ${key}: Loaded from config (${this.maskSensitiveData(value)})`);
                    process.env[key] = value;
                } else {
                    console.log(`⚠️ ${key}: Not found`);
                }
            });
        }
        
        const allEnvVars = Object.keys(process.env);
        const safeEnvVars = allEnvVars.filter(key => 
            !key.toLowerCase().includes('secret') && 
            !key.toLowerCase().includes('key') &&
            !key.toLowerCase().includes('password')
        );
        
        console.log('📋 Available environment variables:', safeEnvVars);
    }

    private maskSensitiveData(value: string): string {
        return value.replace(/([^:]+:\/\/[^:]+:)([^@]+)(@)/, '$1***$3');
    }

    private substituteEnvironmentVariables(value: string): string {
        return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            const envValue = process.env[varName];
            if (envValue) {
                console.log(`🔄 Substituting ${match} with environment variable ${varName}`);
                return envValue;
            } else {
                console.log(`⚠️ Environment variable ${varName} not found for substitution`);
                return match; 
            }
        });
    }

    private createProject() {
        const { type, config } = this.config.project;

        switch (type) {
            case 'node':
                return new NodeProject(config);
            case 'rust':
                return new RustProject(config);
            default:
                throw new Error(`Unsupported project type: ${type}`);
        }
    }

    private createProvider() {
        const { type, config } = this.config.provider;

        switch (type) {
            case 'aws':
                return new AwsProvider(config);
            default:
                throw new Error(`Unsupported provider type: ${type}`);
        }
    }

    private async createAction(actionName: string, project: any, provider: any) {
        switch (actionName.toLowerCase()) {
            case 'lint':
                return new LintAction(project, this.config);
            case 'build':
                return new BuildAction(project, this.config);
            case 'deploy':
                return new DeployAction(provider, this.config.environment, project, this.config);
            default:
                throw new Error(`Unsupported action: ${actionName}`);
        }
    }

    async run() : Promise<void>{
        console.log('Starting CI/CD Pipeline...');
        console.log(`Project Type: ${this.config.project.type}`);
        console.log(`Provider: ${this.config.provider.type}`);
        console.log(`Environment: ${this.config.environment}`);
        console.log(`Steps: ${this.config.steps.join(', ')}`);
        console.log('');

        try{
            const project = this.createProject();
            const provider = this.createProvider();

            for (const step of this.config.steps){
                console.log(`\n Running step : ${step}`);
                if (step === 'deploy' && !provider.isDeploymentRequired()) {
                    console.log('Skipping deployment - no deployment configuration found');
                    continue;
                }
                
                const action = await this.createAction(step , project , provider);
                await action.run();
                console.log(`\n Step ${step} completed successfully`);
            }

            console.log('\n 🎉 CI/CD Pipeline completed successfully!');
        }catch(error : any){
            console.error('\n 🚨 CI/CD Pipeline failed:');
            console.error(error.message || error);
            process.exit(1);
        }
    }
}

async function main() {
    const configPath = process.argv[2] || 'config.yml';
    
    try {
        const cicd = new CICDSystem(configPath);
        await cicd.run();
    } catch (error) {
        console.error('Failed to start CI/CD system:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { CICDSystem };