import {ParamMap, PRIMARY_OUTLET, UrlSegment, UrlSegmentGroup, UrlTree} from '@angular/router';

import {Matcher} from './matcher';

export type PrefixMatcherConfig = {
  spinner?: string, prefix: string,
  outlet?: string,
  triggerOnParamsChange?: boolean
};

export class PrefixMatcher implements Matcher {
  readonly spinner: string;
  private readonly prefix: string;
  private readonly outlet: string;
  private readonly triggerOnParamsChange: boolean;

  constructor(config: PrefixMatcherConfig) {
    this.spinner = config.spinner || '';
    this.prefix = config.prefix;
    this.outlet = config.outlet || PRIMARY_OUTLET;
    this.triggerOnParamsChange = !!config.triggerOnParamsChange;
  }

  containsDifference(oldUrl: UrlTree, newUrl: UrlTree): boolean {
    // newUrl is always a match
    if (!this.isMatch(oldUrl)) return true;

    const oldSegments =
        this.flattenTree(oldUrl).slice(this.matchingSegments.length);
    const newSegments =
        this.flattenTree(newUrl).slice(this.matchingSegments.length);
    return !this.equalSegments(oldSegments, newSegments);
  }

  isMatch(url: UrlTree): boolean {
    if (this.matchingSegments.length === 0) return true;
    if (!url.root.hasChildren()) return false;
    const segments = this.flattenTree(url);

    return this.comparePairs(segments, this.matchingSegments);
  }

  shouldTrigger(oldUrl: UrlTree, newUrl: UrlTree): boolean {
    if (!this.triggerOnParamsChange) return false;
    // newUrl is always a match
    if (!this.isMatch(oldUrl)) return true;
    if (this.matchingSegments.length === 0) return false;

    const oldSegments =
        this.flattenTree(oldUrl).slice(0, this.matchingSegments.length);
    const newSegments =
        this.flattenTree(newUrl).slice(0, this.matchingSegments.length);

    return !this.equalParams(oldSegments, newSegments);
  }

  private get matchingSegments() {
    return this.prefix.split('/')
        .filter(s => s !== '')
        .map(s => new RegExp(`^${s}$`));
  }

  private flattenTree(url: UrlTree) {
    return this.flattenGroup(url.root.children[this.outlet]);
  }

  private flattenGroup(g: UrlSegmentGroup): UrlSegment[] {
    if (!g) return [];
    const c = g.children[PRIMARY_OUTLET];
    return c ? [...g.segments, ...this.flattenGroup(c)] : g.segments;
  }

  private comparePairs(s: UrlSegment[], matchers: RegExp[]) {
    if (matchers.length > s.length) return false;
    for (let i = 0; i < matchers.length; ++i) {
      if (!s[i].path.match(matchers[i])) return false;
    }
    return true;
  }

  private equalParams(oldSegments: UrlSegment[], newSegments: UrlSegment[]) {
    for (let i = 0; i < oldSegments.length; ++i) {
      if (!this.equalMaps(
              oldSegments[i].parameterMap, newSegments[i].parameterMap)) {
        return false;
      }
    }
    return true;
  }

  private equalSegments(oldSegments: UrlSegment[], newSegments: UrlSegment[]) {
    if (oldSegments.length !== newSegments.length) return false;
    for (let i = 0; i < oldSegments.length; ++i) {
      if (oldSegments[i].toString() !== newSegments[i].toString()) {
        return false;
      }
    }
    return true;
  }

  private equalMaps(a: ParamMap, b: ParamMap) {
    if (a.keys.length !== b.keys.length) return false;
    for (let i = 0; i < a.keys.length; ++i) {
      if (!this.equalArrays(a.getAll(a.keys[i]), b.getAll(a.keys[i]))) {
        return false;
      }
    }
    return true;
  }

  private equalArrays(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
