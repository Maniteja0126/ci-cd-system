
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
}
