import { describe, expect, it } from 'vitest';
import { resolveBuildInfo } from './buildInfo.ts';

const SHA = '0123456789abcdef0123456789abcdef01234567';

describe('resolveBuildInfo', () => {
  it('defaults to a local build', () => {
    expect(resolveBuildInfo({})).toEqual({ basePath: '/', commit: 'dev', target: 'local' });
  });

  it('normalises BASE_PATH', () => {
    expect(resolveBuildInfo({ BASE_PATH: 'piano-tutor' }).basePath).toBe('/piano-tutor/');
    expect(resolveBuildInfo({ BASE_PATH: '/piano-tutor/' }).basePath).toBe('/piano-tutor/');
    expect(resolveBuildInfo({ BASE_PATH: '/' }).basePath).toBe('/');
    expect(resolveBuildInfo({ BASE_PATH: '' }).basePath).toBe('/');
  });

  it('reads the GitHub Pages environment', () => {
    expect(
      resolveBuildInfo({
        BASE_PATH: '/piano-tutor/',
        DEPLOY_TARGET: 'github-pages',
        GITHUB_SHA: SHA,
      }),
    ).toEqual({ basePath: '/piano-tutor/', commit: '0123456', target: 'github-pages' });
  });

  it('reads the Cloudflare Pages environment', () => {
    expect(resolveBuildInfo({ CF_PAGES: '1', CF_PAGES_COMMIT_SHA: SHA })).toEqual({
      basePath: '/',
      commit: '0123456',
      target: 'cloudflare-pages',
    });
  });

  it('ignores an unknown DEPLOY_TARGET', () => {
    expect(resolveBuildInfo({ DEPLOY_TARGET: 'netlify' }).target).toBe('local');
    expect(resolveBuildInfo({ DEPLOY_TARGET: 'netlify', CF_PAGES: '1' }).target).toBe(
      'cloudflare-pages',
    );
  });
});
