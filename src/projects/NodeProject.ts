
import { Project } from '../core/Project';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export class NodeProject extends Project {
  private packageManager: PackageManager;

  constructor(config: any) {
    super('node', config);
    this.packageManager = config.packageManager || 'npm';
  }

  private getCommand(script: string): string {
    switch (this.packageManager) {
      case 'yarn':
        return `yarn ${script}`;
      case 'pnpm':
        return `pnpm ${script}`;
      case 'bun':
        return `bun ${script}`;
      case 'npm':
      default:
        return `npm run ${script}`;
    }
  }

  getBuildCommand(): string {
    return this.getCommand('build');
  }

  getLintCommand(): string {
    return this.getCommand('lint');
  }

  getTestCommand(): string {
    return this.getCommand('test');
  }

  getDeploymentCommands(): string[] {
    const appName = this.config.appName || 'app';
    return [
      'npm install --production',
      `npm run ${this.config.buildScript || 'build'}`,
      `pm2 delete ${appName} || true`,
      `pm2 start npm --name "${appName}" -- start`,
      'pm2 save',
      'sudo pm2 startup || true'
    ];
  }
}
