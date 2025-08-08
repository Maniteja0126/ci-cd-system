import {
    ECSClient,
    UpdateServiceCommand,
    DescribeServicesCommand,
  } from "@aws-sdk/client-ecs";
  
import { Provider } from "../core/Provider";
import { Project } from "../core/Project";
import { exec } from 'child_process';

export class AwsProvider extends Provider {
    private ecsClient: ECSClient;
    
    constructor(config: any) {
        super("AWS", config);

        this.ecsClient = new ECSClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }

    isDeploymentRequired(): boolean {
        // Check for both ECS and EC2 deployment configs
        return !!(
            this.config?.dev?.cluster || this.config?.staging?.cluster || this.config?.prod?.cluster ||
            this.config?.dev?.host || this.config?.staging?.host || this.config?.prod?.host
        );
    }

    async deploy(environment: string, project?: Project): Promise<void> {
        if (!this.config[environment]) {
            throw new Error(`No configuration found for environment: ${environment}`);
        }
        
        const envConfig = this.config[environment];
        
        // Check if it's ECS deployment (has cluster/service) or EC2 deployment (has host)
        if (envConfig.cluster && envConfig.service) {
            await this.deployToECS(environment);
        } else if (envConfig.host) {
            await this.deployToEC2(environment, project);
        } else {
            throw new Error("No valid deployment configuration found. Provide either cluster/service for ECS or host for EC2");
        }
    }

    private async deployToECS(environment: string): Promise<void> {
        const clusterName = this.config[environment].cluster;
        const serviceName = this.config[environment].service;

        if (!clusterName || !serviceName) {
            throw new Error("Cluster and service names are required for ECS deployment");
        }
        
        this.log(`Deploying to AWS ECS - Cluster: ${clusterName}, Service: ${serviceName}`);

        try {
            const updateResult = await this.ecsClient.send(
                new UpdateServiceCommand({
                  cluster: clusterName,
                  service: serviceName,
                  forceNewDeployment: true,
                })
              );

            this.log(`Update initiated: ${updateResult.service?.serviceArn}`);

            await this.waitForServiceStable(clusterName, serviceName);
            this.log(`ECS deployment completed successfully`);

        } catch (error: any) {
            this.error(`ECS deployment failed: ${error.message || error}`);
            throw error;
        }
    }

    private async deployToEC2(environment: string, project?: Project): Promise<void> {
        const { host, user, keyPath, appPath } = this.config[environment];

        if (!host || !user) {
            throw new Error("Host and user are required for EC2 deployment");
        }

        this.log(`Deploying to AWS EC2 - Host: ${host}, User: ${user}`);

        try {
            // Pull latest code
            await this.runSSHCommand(host, user, keyPath, `cd ${appPath} && git pull origin main`);
            
            if (project) {
                // Let the project handle its own deployment commands
                const deployCommands = project.getDeploymentCommands();
                for (const command of deployCommands) {
                    await this.runSSHCommand(host, user, keyPath, `cd ${appPath} && ${command}`);
                }
            }

            this.log(`EC2 deployment completed successfully`);
        } catch (error: any) {
            this.error(`EC2 deployment failed: ${error.message || error}`);
            throw error;
        }
    }

    private async runSSHCommand(host: string, user: string, keyPath: string, command: string): Promise<void> {
        const sshCommand = `ssh -i ${keyPath} -o StrictHostKeyChecking=no ${user}@${host} "${command}"`;
        this.log(`Executing: ${command}`);
        
        return new Promise((resolve, reject) => {
            exec(sshCommand, (error, stdout, stderr) => {
                if (stdout) this.log(`stdout: ${stdout}`);
                if (stderr) this.log(`stderr: ${stderr}`);
                
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
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