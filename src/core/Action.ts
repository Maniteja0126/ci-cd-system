export abstract class Action {
    protected name : string;
    protected config : any;


    constructor(name : string , config : any) {
        this.name = name;
        this.config = config;
    }

    abstract run() : Promise<void>;

    protected log(message: string): void {
        (globalThis as any).console?.log?.(`[${this.name}] ${message}`);
    }
    protected error(message: string): void {
        (globalThis as any).console?.error?.(`[${this.name}] ERROR: ${message}`);
    }
}
