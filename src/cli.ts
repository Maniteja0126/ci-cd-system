import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Config } from './types';
import { NextJsProject } from './projects/NextJsProject';
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
    }

    private loadConfig(configPath: string): Config {
        try {
            const fileContents = fs.readFileSync(configPath, 'utf-8');
            return yaml.load(fileContents) as Config;
        } catch (error) {
            throw new Error(`Failed to load config from ${configPath}: ${error}`);
        }
    }

    private createProject() {
        const { type, config } = this.config.project;

        switch (type) {
            case 'nextjs':
                return new NextJsProject(config);
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
                return new DeployAction(provider, this.config.environment, this.config);
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