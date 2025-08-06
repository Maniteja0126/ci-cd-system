import {
    ECSClient,
    UpdateServiceCommand,
    DescribeServicesCommand,
  } from "@aws-sdk/client-ecs";
  
import { Provider } from "../core/Provider";

export  class AwsProvider extends Provider {
    private ecsClient  : ECSClient;
    
    constructor(config : any){
        super("AWS" , config);

        this.ecsClient = new ECSClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }

    isDeploymentRequired(): boolean {
        return !!(this.config?.dev?.cluster || this.config?.staging?.cluster || this.config?.prod?.cluster);
    }

    async deploy(environment : string) : Promise<void> {
        if (!this.config[environment]) {
            throw new Error(`No configuration found for environment: ${environment}`);
        }
        
        const clusterName = this.config[environment].cluster;
        const serviceName = this.config[environment].service;

        if(!clusterName || !serviceName){
            throw new Error("Cluster and service names are required");
        }
        this.log(`Deploying to AWS ECS - Cluster: ${clusterName}, Service: ${serviceName}`);

        try{
            const updateResult = await this.ecsClient.send(
                new UpdateServiceCommand({
                  cluster: clusterName,
                  service: serviceName,
                  forceNewDeployment: true,
                })
              );

            this.log(`Update initiated: ${updateResult.service?.serviceArn}`);

            await this.waitForServiceStable(clusterName , serviceName);
            this.log(`Deployment completed successfully`);

        }catch(error : any){
            this.error(`Deployment failed: ${error.message || error}`);
            throw error;
        }
    }

    async getCredentials(): Promise<any> {
        return {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_REGION || 'us-east-1',
        };
      }

    private async waitForServiceStable(cluster: string, service: string) {
        this.log('Waiting for ECS service to become stable...');
        let attempts = 0;
      
        while (attempts < 10) {
          const result = await this.ecsClient.send(
            new DescribeServicesCommand({ cluster, services: [service] })
          );
      
          const status = result.services?.[0]?.deployments?.[0]?.rolloutState;
          if (status === 'COMPLETED') {
            this.log('ECS service is stable');
            return;
          }
      
          await new Promise((resolve) => setTimeout(resolve, 5000));
          attempts++;
        }
      
        throw new Error('ECS service did not stabilize in time');
      }
}