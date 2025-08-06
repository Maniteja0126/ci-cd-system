import { Project } from '../core/Project';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export class NextJsProject extends Project {
  private packageManager: PackageManager;

  constructor(config: any) {
    super('NextJs', config);
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

  getTestCommand(): string {
    return this.getCommand('test');
  }

  getLintCommand(): string {
    return this.getCommand('lint');
  }
}
