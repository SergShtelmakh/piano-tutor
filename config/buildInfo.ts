// Build configuration resolved from environment variables. Pure: no Node or Vite imports.

export type DeployTarget = 'github-pages' | 'cloudflare' | 'local';

export interface BuildInfo {
  basePath: string;
  commit: string;
  target: DeployTarget;
}

type Env = Record<string, string | undefined>;

function normaliseBase(raw: string | undefined): string {
  const trimmed = raw?.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

function resolveTarget(env: Env): DeployTarget {
  if (env.DEPLOY_TARGET === 'github-pages' || env.DEPLOY_TARGET === 'cloudflare') {
    return env.DEPLOY_TARGET;
  }
  return env.CF_PAGES === '1' || env.WORKERS_CI === '1' ? 'cloudflare' : 'local';
}

export function resolveBuildInfo(env: Env): BuildInfo {
  const sha = env.CF_PAGES_COMMIT_SHA || env.WORKERS_CI_COMMIT_SHA || env.GITHUB_SHA;
  return {
    basePath: normaliseBase(env.BASE_PATH),
    commit: sha ? sha.slice(0, 7) : 'dev',
    target: resolveTarget(env),
  };
}
