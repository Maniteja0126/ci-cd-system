
import { Project } from '../core/Project';

export class RustProject extends Project {
  constructor(config: any) {
    super('Rust', config);
  }

  getBuildCommand(): string {
    return 'cargo build --release';
  }

  getLintCommand(): string {
    return 'cargo fmt -- --check && cargo clippy -- -D warnings';
  }

  getTestCommand(): string {
    return 'cargo test';
  }

  getDeploymentCommands(): string[] {
    const appName = this.config.appName || 'app';
    return [
        'cargo build --release',
        `pkill -f ${appName} || true`,
        `nohup ./target/release/${appName} > app.log 2>&1 &`
    ];
}
}