// src/actions/BuildAction.ts
import { Action } from '../core/Action';
import { Project } from '../core/Project';
import { exec } from 'child_process';

export class BuildAction extends Action {
  private project: Project;

  constructor(project: Project, config: any) {
    super('Build', config);
    this.project = project;
  }

  async run(): Promise<void> {
    this.log('Starting build...');

    try {
      const buildCommand = this.project.getBuildCommand();
      this.log(`Running: ${buildCommand}`);

      await this.executeCommand(buildCommand);

      this.log('Build completed successfully');
    } catch (error: any) {
      this.error(`Build failed: ${error.message || error}`);
      throw error;
    }
  }

  private async executeCommand(command: string): Promise<void> {
    this.log(`Executing command: ${command}`);

    await new Promise<void>((resolve, reject) => {
      const child = exec(command, (error, stdout, stderr) => {
        if (stdout) this.log(`stdout:\n${stdout}`);
        if (stderr) this.log(`stderr:\n${stderr}`);

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });

      if (child.stdout) child.stdout.pipe(process.stdout);
      if (child.stderr) child.stderr.pipe(process.stderr);
    });
  }
}
