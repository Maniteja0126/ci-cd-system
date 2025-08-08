import { Project } from "./Project";

export abstract class Provider {
    protected name : string;
    protected config : any;
    protected project? : Project;

    constructor(name : string , config : any) {
        this.name = name;
        this.config = config;
    }

    abstract deploy(environment : string , project? : Project) : Promise<void>;
    abstract getCredentials() : Promise<any>;

    abstract isDeploymentRequired(): boolean;


    protected log(message: string): void {
        (globalThis as any).console?.log?.(`[${this.name}] ${message}`);
    }

    protected error(message: string): void {
        (globalThis as any).console?.error?.(`[${this.name}] ERROR: ${message}`);
      }

}