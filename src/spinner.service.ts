import {OnDestroy} from '@angular/core';
import {Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RoutesRecognized, UrlTree} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

import {Matcher} from './matcher';
import {SpinnerDirective} from './spinner.directive';

export class Node {
  constructor(
      public readonly directive: SpinnerDirective,
      public readonly matcher: Matcher, public children: Node[] = []) {}
}

export class SpinnerService implements OnDestroy {
  private root: Node|null;
  private active: SpinnerDirective[];
  private subscription: Subscription;
  private matchers: Matcher[] = [];

  constructor(private router: Router) {}

  init() {
    if (this.subscription) return;
    this.subscription = this.router.events.subscribe((e: Event) => {
      if (e instanceof NavigationStart) {
        this.activateSpinners(
            this.router.parseUrl(this.router.url), this.router.parseUrl(e.url),
            e);

      } else if (e instanceof RoutesRecognized) {
        this.deactivateSpinners(e);
        this.activateSpinners(
            this.router.parseUrl(this.router.url),
            this.router.parseUrl(e.urlAfterRedirects), e);

      } else if (
          e instanceof NavigationEnd || e instanceof NavigationError ||
          e instanceof NavigationCancel) {
        this.deactivateSpinners(e);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addMatchers(matchers: Matcher[]) {
    this.matchers = [...this.matchers, ...matchers];
  }

  registerSpinner(s: SpinnerDirective) {
    if (s.spinner && !s.parentSpinner) {
      throw new Error('Global spinner directive should not have any name set');
    }
    if (this.root && !s.parentSpinner) {
      throw new Error('There can be only one root');
    }
    const m = this.findMatcherFor(s);
    if (s.parentSpinner) {
      this.findNode(s.parentSpinner).children.push(new Node(s, m));
    } else {
      this.root = new Node(s, m);
    }
  }

  unregisterSpinner(s: SpinnerDirective) {
    if (s.parentSpinner) {
      const p = this.findNode(s.parentSpinner);
      p.children = p.children.filter(c => c.directive !== s);
    } else {
      this.root = null;
    }
  }

  private activateSpinners(oldUrl: UrlTree, newUrl: UrlTree, e: Event) {
    this.active =
        this.collectSpinnersToActivate(this.root, oldUrl, newUrl);
    this.active.forEach(c => c.activate(e));
  }

  private deactivateSpinners(e: Event) {
    this.active.forEach(c => c.deactivate(e));
    this.active = [];
  }

  private findMatcherFor(s: SpinnerDirective): Matcher {
    return this.matchers.filter(mm => mm.spinner === s.spinner)[0];
  }

  private findNode(s: SpinnerDirective): Node {
    if (!this.root) {
      throw new Error(`No spinner directive '${s.spinner}' found`);
    }
    const res = this.findNodeInner(this.root, s);
    if (res === null) {
      throw new Error(`No spinner directive '${s.spinner}' found`);
    }
    return res;
  }

  private findNodeInner(node: Node, s: SpinnerDirective): Node|null {
    if (node.directive === s) return node;
    for (let i = 0; i < node.children.length; ++i) {
      const c = this.findNodeInner(node.children[i], s);
      if (c) return c;
    }
    return null;
  }

  private collectSpinnersToActivate(
      node: Node, oldUrl: UrlTree, newUrl: UrlTree): SpinnerDirective[] {
    if (!node.matcher || !node.matcher.isMatch(newUrl)) return [];

    if (node.matcher.shouldTrigger(oldUrl, newUrl)) {
      return [node.directive];

    } else if (node.matcher.containsDifference(oldUrl, newUrl)) {
      const r = node.children.reduce(
          (m,
           c) => [...m, ...this.collectSpinnersToActivate(c, oldUrl, newUrl)],
          []);
      return r.length === 0 ? [node.directive] : r;
    } else {
      return [];
    }
  }
}
