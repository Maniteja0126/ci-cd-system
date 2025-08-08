import { Action } from '../core/Action';
import { Provider } from '../core/Provider';
import { Project } from '../core/Project';

export class DeployAction extends Action {
    private provider : Provider;
    private environment : string;
    private project? : Project;

    constructor(provider : Provider , environment : string , project : Project , config : any) {
        super("Deploy" , config);
        this.provider = provider;
        this.environment = environment;
        this.project = project;
    }

    async run() : Promise<void> {
        this.log(`Starting deployment to ${this.environment}...`);

        try {
            if (!this.provider.isDeploymentRequired()) {
               this.log('No deployment configuration found. Skipping deployment step.');
               this.log('Available deployment options:');
               this.log('- s3Bucket: For static website hosting');
               this.log('- lambdaFunction: For serverless functions');
               this.log('- ecsService: For containerized applications');
               this.log('- cloudFrontDistribution: For CDN updates');
               return;
            }
            await this.provider.deploy(this.environment , this.project);
            this.log(`Deployment to ${this.environment} completed successfully`);
        } catch (error : any) {
            this.error(`Deployment failed: ${error.message || error}`);
            throw error;
        }
    }
}