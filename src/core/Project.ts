export abstract class Project {
    protected type : string;
    protected config : any;

    constructor(type : string , config : any) {
        this.type = type;
        this.config = config;
    }

    abstract getBuildCommand(): string;
    abstract getTestCommand(): string;
    abstract getLintCommand(): string;

    getType() : string {
        return this.type;
    }

    getConfig() : any {
        return this.config;
    }

}