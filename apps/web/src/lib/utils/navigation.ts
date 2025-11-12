import type { NextRouter } from 'next/router';

/**
 * Navigate while preserving existing query parameters
 * @param router - Next.js router instance
 * @param path - New path to navigate to
 * @param options - Navigation options
 */
export function navigateWithParams(
  router: NextRouter,
  path: string,
  options?: { shallow?: boolean; preserveParams?: boolean }
) {
  const { shallow = true, preserveParams = true } = options || {};

  if (!preserveParams) {
    return router.push(path, undefined, { shallow });
  }

  // Preserve existing query params from current URL
  const queryString = window.location.search;
  return router.push(`${path}${queryString}`, undefined, { shallow });
}