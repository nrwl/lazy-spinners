import {CommonModule} from '@angular/common';
import {Inject, InjectionToken, ModuleWithProviders, NgModule} from '@angular/core';
import {Router} from '@angular/router';

import {Matcher} from './matcher';
import {PrefixMatcher, PrefixMatcherConfig} from './prefix-matcher';
import {SpinnerDirective} from './spinner.directive';
import {SpinnerService} from './spinner.service';

export const Matchers = new InjectionToken<PrefixMatcherConfig[]>('Matcher');

export function createSpinnerService(router: Router) {
  return new SpinnerService(router);
}

@NgModule({
  declarations: [SpinnerDirective],
  imports: [CommonModule],
  exports: [SpinnerDirective]
})
export class SpinnerModule {
  constructor(
      s: SpinnerService,
      @Inject(Matchers) matcherConfigs: PrefixMatcherConfig[][]) {
    s.addMatchers(this.createPrefixMatcher(
        matcherConfigs.reduce((m, c) => [...m, ...c], [])));
    s.init();
  }

  private createPrefixMatcher(matcherConfigs: PrefixMatcherConfig[]):
      PrefixMatcher[] {
    return matcherConfigs.map(c => new PrefixMatcher(c));
  }

  /**
   * @whatItDoes configures spinner matchers and creates SpinnerService.
   *
   * It should only be used at the root of the application.
   */
  static forRoot(matchers: PrefixMatcherConfig[]): ModuleWithProviders {
    return {
      ngModule: SpinnerModule,
      providers: [
        {provide: Matchers, multi: true, useValue: matchers}, {
          provide: SpinnerService,
          useFactory: createSpinnerService,
          deps: [Router]
        }
      ]
    };
  }

  /**
   * @whatItDoes configures spinner matchers
   */
  static forChild(matchers: PrefixMatcherConfig[]): ModuleWithProviders {
    return {
      ngModule: SpinnerModule,
      providers: [{provide: Matchers, multi: true, useValue: matchers}]
    };
  }
}
