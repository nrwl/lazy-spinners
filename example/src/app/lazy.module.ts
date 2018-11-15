import {NgModule, Component} from '@angular/core';
import {SpinnerModule, PrefixMatcher, SpinnerService} from '@nrwl/spinner';
import {CanActivate, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

export class LazyCanActivateGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    let res
    const r = new Promise(_res => res = _res);
    setTimeout(() => res(true), 2000);
    return r;
  }
}
@Component({
  selector: 'app-root',
  template: `
    <div style="height: 100px; margin: 20px; border: 1px solid; display: block;">
    <div spinner="lazy">
      lazy
      <router-outlet></router-outlet>
    </div>
    </div>
  `
})
export class LazyComponent {
}

@Component({
  template: `
        component-a
  `
})
export class LazyCompA {}

@Component({
  template: `
        component-b
  `
})
export class LazyCompB {}

@NgModule({
  declarations: [LazyComponent, LazyCompA, LazyCompB],
  imports: [
    SpinnerModule.forChild([
      {
        spinner: 'lazy',
        prefix: '/lazy'
      }
    ]),
    RouterModule.forChild([
      {
        path: '', component: LazyComponent, children: [
          {path: 'a', component: LazyCompA, canActivate: [LazyCanActivateGuard]},
          {path: 'b', component: LazyCompB, canActivate: [LazyCanActivateGuard]}
        ]
      }
    ])
  ],
  providers: [LazyCanActivateGuard]
})
export class LazyModule {
}
