import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

describe('Project setup checks', () => {
  it('.gitignore contains .env rule', () => {
    const gitignore = readFileSync(resolve(__dirname, '..', '.gitignore'), 'utf-8');
    expect(gitignore).toContain('.env');
  });

  it('.gitignore negates .env.example so it is tracked', () => {
    const gitignore = readFileSync(resolve(__dirname, '..', '.gitignore'), 'utf-8');
    expect(gitignore).toContain('!.env.example');
  });

  it('no .env* file other than .env.example is tracked by git', () => {
    // List all tracked files matching .env*
    let trackedEnvFiles: string[];
    try {
      const output = execSync('git ls-files .env*', {
        cwd: resolve(__dirname, '..'),
        encoding: 'utf-8',
      });
      trackedEnvFiles = output.trim().split('\n').filter(Boolean);
    } catch {
      // git not initialized yet or no files tracked — that's fine
      trackedEnvFiles = [];
    }

    const nonExampleEnvFiles = trackedEnvFiles.filter(
      (f) => f !== '.env.example'
    );
    expect(nonExampleEnvFiles).toEqual([]);
  });
});
