import { exec } from 'child_process';
import { Action } from '../core/Action';
import { Project } from '../core/Project';

export class LintAction extends Action {
    private project: Project;

    constructor(project: Project, config: any) {
        super("Lint", config);
        this.project = project;
    }

    async run(): Promise<void> {
        this.log(`🔍 Starting linting...`);

        try {
            const lintCommand = this.project.getLintCommand();
            this.log(`Running lint command: ${lintCommand}`);

            await this.executeCommand(lintCommand);

            this.log(`Linting completed successfully`);
        } catch (error: any) {
            this.error(`Linting failed: ${error.message || error}`);
            throw error;
        }
    }

    private executeCommand(command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const process = exec(command, (error, stdout, stderr) => {
                if (stdout) this.log(`Output:\n${stdout}`);
                if (stderr) this.log(`Warnings:\n${stderr}`);

                if (error) {
                    reject(new Error(`Command failed: ${error.message}`));
                } else {
                    resolve();
                }
            });

            if (process.stdout) {
                process.stdout.on('data', (data) => {
                    this.log(`Output:\n${data}`);
                });
            }
            if (process.stderr) {
                process.stderr.on('data', (data) => {
                    this.log(`Warnings:\n${data}`);
                });
            }
        });
    }
}
