import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Component, NgModule} from '@angular/core';
import {CanActivate, Router, RouterModule} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {Subject} from 'rxjs/Subject';
import {PrefixMatcher, SpinnerModule, SpinnerService} from '../src/index';

@Component({
  template: 'a-directive'
})
class AComponent {
}

@Component({
  template: 'b-directive'
})
class BComponent {
}

@Component({
  template: `
      lazy-loaded-directive
      <div spinner="inner">
      </div>
  `
})
class LazyLoadedComponent {
}


class CanActivateGuard implements CanActivate {
  public subject = new Subject<boolean>();

  canActivate() {
    return this.subject;
  }
}

describe('SpinnerModule', () => {
  describe('single spinner', () => {
    @Component({
      template: `
          <div spinner>
              root
              <router-outlet></router-outlet>
          </div>
      `
    })
    class RootComponent {
    }

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          AComponent, BComponent, RootComponent
        ],
        imports: [
          SpinnerModule.forRoot([
            {
              prefix: '/'
            }
          ]),
          RouterTestingModule.withRoutes([
            {path: '', pathMatch: 'full', redirectTo: '/a'},
            {path: 'a', component: AComponent},
            {path: 'b', component: BComponent, canActivate: [CanActivateGuard]}
          ])
        ],
        providers: [
          CanActivateGuard
        ]
      }).compileComponents();

      TestBed.get(SpinnerService).init();
    }));

    it('should show a spinner between NavigationStart and NavigationEnd', fakeAsync(() => {
      const router = TestBed.get(Router);
      const instance = createRoot(router, RootComponent);
      const e = instance.nativeElement;

      router.navigateByUrl('/b');
      advance(instance);

      expect(isSpinning(e)).toBe(true);
      expect(e.innerText).toContain('a-directive');
      completeGuard(true);
      advance(instance);

      expect(isSpinning(e)).toBe(false);
      expect(e.innerText).toContain('b-directive');
    }));

    it('should show a spinner between NavigationStart and NavigationCancel', fakeAsync(() => {
      const router = TestBed.get(Router);
      const instance = createRoot(router, RootComponent);
      const e = instance.nativeElement;

      router.navigateByUrl('/b');
      advance(instance);

      completeGuard(false);
      advance(instance);

      expect(isSpinning(e)).toBe(false);
      expect(e.innerText).toContain('a-directive');
    }));
  });

  describe('multiple spinners', () => {
    @Component({
      template: `
          <div spinner>
              <div spinner="first">
              </div>
              <div spinner="second">
              </div>
          </div>

          root
          <router-outlet></router-outlet>
      `
    })
    class RootComponent {
    }

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          AComponent, BComponent, RootComponent
        ],
        imports: [
          SpinnerModule.forRoot([
            {
              prefix: '/'
            },
            {
              spinner: 'first',
              prefix: '/child'
            },
            {
              spinner: 'second',
              prefix: '/child'
            }
          ]),
          RouterTestingModule.withRoutes([
            {path: '', pathMatch: 'full', redirectTo: '/a'},
            {path: 'a', component: AComponent},
            {path: 'c', component: AComponent, canActivate: [CanActivateGuard]},

            {
              path: 'child',
              children:
                [
                  {path: 'b', component: BComponent, canActivate: [CanActivateGuard]}
                ]
            }
          ])
        ],
        providers: [
          CanActivateGuard
        ]
      }).compileComponents();

      TestBed.get(SpinnerService).init();
    }));

    it('should show two child spinners instead of the parent one', fakeAsync(() => {
      const router = TestBed.get(Router);
      const instance = createRoot(router, RootComponent);
      const e = instance.nativeElement;

      router.navigateByUrl('/child/b');
      advance(instance);

      expect(isSpinning(e)).toBe(false);
      expect(isSpinning(e, 'first')).toBe(true);
      expect(isSpinning(e, 'second')).toBe(true);

      completeGuard(true);
      advance(instance);

      expect(isSpinning(e)).toBe(false);
      expect(isSpinning(e, 'first')).toBe(false);
      expect(isSpinning(e, 'second')).toBe(false);
    }));

    it('should show the parent spinner when no children matched the URL', fakeAsync(() => {
      const router = TestBed.get(Router);
      const instance = createRoot(router, RootComponent);
      const e = instance.nativeElement;

      router.navigateByUrl('/c');
      advance(instance);

      expect(isSpinning(e)).toBe(true);
      expect(isSpinning(e, 'first')).toBe(false);
      expect(isSpinning(e, 'second')).toBe(false);

      completeGuard(true);
      advance(instance);

      expect(isSpinning(e)).toBe(false);
      expect(isSpinning(e, 'first')).toBe(false);
      expect(isSpinning(e, 'second')).toBe(false);
    }));
  });

  describe('lazy loading', () => {
    @Component({
      template: `
          <div spinner>
              <div spinner="before">
              </div>
              <div spinner="after">
              </div>
          </div>
          <router-outlet></router-outlet>
      `
    })
    class RootComponent {
    }

    let returnLazyLoaded: Subject<any>;

    beforeEach(async(() => {
      returnLazyLoaded = new Subject<any>();

      TestBed.configureTestingModule({
        declarations: [
          AComponent, BComponent, RootComponent
        ],
        imports: [
          SpinnerModule.forRoot([
            {
              prefix: '/'
            },
            {
              spinner: 'before',
              prefix: '/before'
            },
            {
              spinner: 'after',
              prefix: '/after'
            }
          ]),
          RouterTestingModule.withRoutes([
            {path: '', pathMatch: 'full', redirectTo: '/a'},
            {path: 'a', component: AComponent},
            {path: 'before', loadChildren: () => returnLazyLoaded},
            {path: 'after', component: BComponent, canActivate: [CanActivateGuard]}
          ])
        ],
        providers: [
          CanActivateGuard
        ]
      }).compileComponents();

      TestBed.get(SpinnerService).init();
    }));

    it('should change the spinner if needed after the configuration has been loaded', fakeAsync(() => {
      @NgModule({
        imports: [
          RouterModule.forChild([
            {path: '', redirectTo: '/after'}
          ])
        ]
      })
      class LazyModule {
      }

      const router = TestBed.get(Router);

      const instance = createRoot(router, RootComponent);
      const e = instance.nativeElement;

      router.navigateByUrl('/before');
      advance(instance);

      expect(isSpinning(e, 'before')).toBe(true);
      expect(isSpinning(e, 'after')).toBe(false);

      returnLazyLoaded.next(LazyModule);
      returnLazyLoaded.complete();
      advance(instance);

      expect(isSpinning(e, 'before')).toBe(false);
      expect(isSpinning(e, 'after')).toBe(true);

      completeGuard(true);
      advance(instance);

      expect(isSpinning(e, 'before')).toBe(false);
      expect(isSpinning(e, 'after')).toBe(false);
    }));
  });

  describe('eager forChild', () => {
    @Component({
      template: `
          <div spinner>
              <div spinner="inner">
              </div>
          </div>
          <router-outlet></router-outlet>
      `
    })
    class RootComponent {
    }

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          AComponent, BComponent, RootComponent
        ],
        imports: [
          SpinnerModule.forRoot([
            {
              prefix: '/'
            }
          ]),
          SpinnerModule.forChild([
            {
              prefix: '/target',
              spinner: 'inner'
            }
          ]),
          RouterTestingModule.withRoutes([
            {path: '', pathMatch: 'full', component: AComponent},
            {path: 'target', component: BComponent, canActivate: [CanActivateGuard]}
          ])
        ],
        providers: [
          CanActivateGuard
        ]
      }).compileComponents();

      TestBed.get(SpinnerService).init();
    }));

    it('should take into account the spinner matchers provided via forChild', fakeAsync(() => {
      const router = TestBed.get(Router);
      const instance = createRoot(router, RootComponent);
      const e = instance.nativeElement;

      router.navigateByUrl('/target');
      advance(instance);

      expect(isSpinning(e, 'inner')).toBe(true);
      completeGuard(true);
      advance(instance);

      expect(isSpinning(e, 'inner')).toBe(false);
    }));
  });

  describe('lazy forChild', () => {
    @Component({
      template: `
          <div spinner>
              <router-outlet></router-outlet>
          </div>
      `
    })
    class RootComponent {
    }

    @NgModule({
      declarations: [LazyLoadedComponent],
      imports: [
        RouterModule.forChild([
          {path: 'first', component: LazyLoadedComponent},
          {path: 'second', component: LazyLoadedComponent, canActivate: [CanActivateGuard]}
        ]),
        SpinnerModule.forChild([
          {
            prefix: '/lazy',
            spinner: 'inner'
          }
        ]),
      ]
    })
    class LazyModule {
    }

    let returnLazyLoaded = new Subject<any>();
    beforeEach(async(() => {
      returnLazyLoaded = new Subject<any>();

      TestBed.configureTestingModule({
        declarations: [
          AComponent, RootComponent
        ],
        imports: [
          SpinnerModule.forRoot([
            {
              prefix: '/'
            }
          ]),
          RouterTestingModule.withRoutes([
            {path: '', pathMatch: 'full', component: AComponent},
            {path: 'lazy', loadChildren: () => returnLazyLoaded},
          ])
        ],
        providers: [
          CanActivateGuard
        ]
      }).compileComponents();

      TestBed.get(SpinnerService).init();
    }));

    it('should take into account the spinner matchers provided via forChild', fakeAsync(() => {
      const router = TestBed.get(Router);
      const instance = createRoot(router, RootComponent);
      const e = instance.nativeElement;
      const global = e.querySelector('[spinner]');

      router.navigateByUrl('/lazy/first');
      advance(instance);

      expect(global.className).toContain('spinning');

      returnLazyLoaded.next(LazyModule);
      returnLazyLoaded.complete();
      advance(instance);
      expect(global.className).not.toContain('spinning');

      const inner = e.querySelector('[spinner=inner]');
      router.navigateByUrl('/lazy/second');
      advance(instance);

      expect(isSpinning(e)).toBe(false);
      expect(isSpinning(e, 'inner')).toBe(true);

      completeGuard(true);
      advance(instance);

      expect(isSpinning(e, 'inner')).toBe(false);
    }));
  });
});

function isSpinning(e: any, spinnerName?: string) {
  if (spinnerName) {
    return e.querySelector(`[spinner=${spinnerName}]`).className.indexOf('spinning') > -1;
  } else {
    return e.querySelector('[spinner]').className.indexOf('spinning') > -1;
  }
}

function completeGuard(value: boolean) {
  TestBed.get(CanActivateGuard).subject.next(value);
  TestBed.get(CanActivateGuard).subject.complete();
}

function createRoot(router: Router, type: any): ComponentFixture<any> {
  const f = TestBed.createComponent(type);
  f.autoDetectChanges(true);
  advance(f);
  router.initialNavigation();
  advance(f);
  return f;
}

function advance(fixture: ComponentFixture<any>): void {
  tick();
  fixture.detectChanges();
}