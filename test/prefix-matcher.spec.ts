import {DefaultUrlSerializer} from '@angular/router';
import {PrefixMatcher} from '../src/index';

describe('PrefixMatcher', () => {
  describe('isMatch', () => {
    it('matches everything with /', () => {
      const matcher = new PrefixMatcher({prefix: '/'});
      expect(isMatch(matcher, '')).toBe(true);
      expect(isMatch(matcher, '/')).toBe(true);
      expect(isMatch(matcher, '/one')).toBe(true);
      expect(isMatch(matcher, '/one/two')).toBe(true);
      expect(isMatch(matcher, '/one;x=1/two;y=1')).toBe(true);
      expect(isMatch(matcher, '/one;x=1/two;y=1(named:three)')).toBe(true);
      expect(isMatch(matcher, '/one;x=1/two;y=1(named:three)?q=1')).toBe(true);
    });

    it('matches everything with ""', () => {
      const matcher = new PrefixMatcher({prefix: ''});
      expect(isMatch(matcher, '')).toBe(true);
      expect(isMatch(matcher, '/')).toBe(true);
      expect(isMatch(matcher, '/one')).toBe(true);
      expect(isMatch(matcher, '/one/two')).toBe(true);
      expect(isMatch(matcher, '/one;x=1/two;y=1')).toBe(true);
      expect(isMatch(matcher, '/one;x=1/two;y=1(named:three)')).toBe(true);
      expect(isMatch(matcher, '/one;x=1/two;y=1(named:three)?q=1')).toBe(true);
    });

    it('works with a single segment', () => {
      const matcher = new PrefixMatcher({prefix: '/aaa'});
      expect(isMatch(matcher, '')).toBe(false);
      expect(isMatch(matcher, '/bbb')).toBe(false, 'wrong path');
      expect(isMatch(matcher, '/(named:aaa)')).toBe(false, 'wrong outlet');
      expect(isMatch(matcher, '/aaa')).toBe(true, 'exact match');
      expect(isMatch(matcher, '/aaa/bbb')).toBe(true, 'prefix match');
      expect(isMatch(matcher, '/aaa;p=1/bbb')).toBe(true, 'adding a param');
    });

    it('works with a single segment with a custom outlet', () => {
      const matcher = new PrefixMatcher({prefix: '/aaa', outlet: 'named'});
      expect(isMatch(matcher, '')).toBe(false);
      expect(isMatch(matcher, '/(named:bbb)')).toBe(false, 'wrong path');
      expect(isMatch(matcher, '/aaa')).toBe(false, 'wrong outlet');
      expect(isMatch(matcher, '/(named:aaa)')).toBe(true, 'exact match');
      expect(isMatch(matcher, '/(named:aaa/bbb)')).toBe(true, 'prefix match');
      expect(isMatch(matcher, '/(named:aaa;p=1/bbb)')).toBe(true, 'adding a param');
    });

    it('works with multiple segments', () => {
      const matcher = new PrefixMatcher({prefix: '/aaa/bbb'});
      expect(isMatch(matcher, '')).toBe(false);
      expect(isMatch(matcher, '/bbb')).toBe(false);
      expect(isMatch(matcher, '/(named:aaa/bbb)')).toBe(false, 'wrong outlet');
      expect(isMatch(matcher, '/aaa/bbb')).toBe(true, 'exact match');
      expect(isMatch(matcher, '/aaa/bbb/ccc')).toBe(true, 'prefix patch');
      expect(isMatch(matcher, '/aaa;p=1/bbb;q=1')).toBe(true, 'params');
    });
  });

  describe('shouldTrigger', () => {
    it('works when triggerOnParamsChange = true', () => {
      const matcher = new PrefixMatcher({prefix: '/aaa/bbb', triggerOnParamsChange: true});

      expect(shouldTrigger(matcher, '/aaa/bbb', '/aaa/bbb')).toBe(false, 'nothing changed');
      expect(shouldTrigger(matcher, '/aaa;p=1/bbb', '/aaa;p=1/bbb')).toBe(false, 'nothing changed with params');
      expect(shouldTrigger(matcher, '/aaa/bbb/ccc;p=1', '/aaa/bbb/ccc')).toBe(false, 'changes are in the segment not captured by the prefix expression');

      expect(shouldTrigger(matcher, '/aaa;p=1/bbb', '/aaa/bbb')).toBe(true, 'removing a param');
      expect(shouldTrigger(matcher, '/aaa;p=1/bbb', '/aaa;p=2/bbb')).toBe(true, 'changing a param');
      expect(shouldTrigger(matcher, '/aaa/bbb', '/aaa;p=1/bbb')).toBe(true, 'adding a param');
      expect(shouldTrigger(matcher, '/somethingelse', '/aaa/bbb')).toBe(true, 'going from a non-match');
    });

    it('works when triggerOnParamsChange = true and prefix=/', () => {
      const matcher = new PrefixMatcher({prefix: '/', triggerOnParamsChange: true});

      expect(shouldTrigger(matcher, '/', '/')).toBe(false);
      expect(shouldTrigger(matcher, '/aaa/bbb', '/aaa/bbb')).toBe(false);
      expect(shouldTrigger(matcher, '/aaa;p=1', '/aaa;p=2')).toBe(false);
    });

    it('works when triggerOnParamsChange = false', () => {
      const matcher = new PrefixMatcher({prefix: '/aaa/bbb', triggerOnParamsChange: false});
      expect(shouldTrigger(matcher, '/aaa/bbb', '/aaa/bbb')).toBe(false);
      expect(shouldTrigger(matcher, '/aaa;p=1/bbb', '/aaa/bbb')).toBe(false);
    });
  });

  describe('containsDifference', () => {
    it('works', () => {
      const matcher = new PrefixMatcher({prefix: '/aaa/bbb'});
      expect(containsDifference(matcher, '/aaa/bbb', '/aaa/bbb')).toBe(false);
      expect(containsDifference(matcher, '/aaa;p=1/bbb', '/aaa;p=2/bbb')).toBe(false);
      expect(containsDifference(matcher, '/aaa/bbb/ccc', '/aaa/bbb/ccc')).toBe(false);

      expect(containsDifference(matcher, '/aaa/bbb', '/aaa/bbb/ccc')).toBe(true, 'adding a segment');
      expect(containsDifference(matcher, '/aaa/bbb/ccc', '/aaa/bbb/ddd')).toBe(true, 'changing a segment');
      expect(containsDifference(matcher, '/aaa/bbb/ccc;p1', '/aaa/bbb/ccc;p2')).toBe(true, 'changing a param in the child segment');
      expect(containsDifference(matcher, '/aaa/bbb/ccc', '/aaa/bbb')).toBe(true, 'removing a segment');
      expect(containsDifference(matcher, '/somethingelse', '/aaa/bbb')).toBe(true, 'going from a non-match');
    });
  });
});

function isMatch(matcher: PrefixMatcher, url: string) {
  const tree = new DefaultUrlSerializer().parse(url);
  return matcher.isMatch(tree);
}

function shouldTrigger(matcher: PrefixMatcher, oldUrl: string, newUrl: string) {
  const oldUrlTree = new DefaultUrlSerializer().parse(oldUrl);
  const newUrlTree = new DefaultUrlSerializer().parse(newUrl);
  return matcher.shouldTrigger(oldUrlTree, newUrlTree);
}

function containsDifference(matcher: PrefixMatcher, oldUrl: string, newUrl: string) {
  const oldUrlTree = new DefaultUrlSerializer().parse(oldUrl);
  const newUrlTree = new DefaultUrlSerializer().parse(newUrl);
  return matcher.containsDifference(oldUrlTree, newUrlTree);
}
