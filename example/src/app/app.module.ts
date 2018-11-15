import { BrowserModule } from '@angular/platform-browser';
import {Component, NgModule} from '@angular/core';
import {CanActivate, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {SpinnerModule, PrefixMatcher, SpinnerService} from '@nrwl/spinner';

@Component({
  selector: 'app-root',
  template: `
    <div style="height: 300px; margin: 20px; border: 1px solid; display: block;">
    <div spinner>
      root
      <router-outlet></router-outlet>
    </div>

    <a routerLink="/a">Open CompA</a>
    <a routerLink="/b">Open CompB</a>
    <a routerLink="/lazy/a">Open LazyCompA</a>
    <a routerLink="/lazy/b">Open LazyCompB</a>
    </div>
  `
})
export class AppComponent {
}

@Component({
  template: `
        component-a
  `
})
export class CompA {}

@Component({
  template: `
        component-b
  `
})
export class CompB {}

export class CanActivateGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    let res
    const r = new Promise(_res => res = _res);
    setTimeout(() => res(true), 2000);
    return r;
  }
}

@NgModule({
  declarations: [
    AppComponent, CompB, CompA
  ],
  imports: [
    BrowserModule,
    SpinnerModule.forRoot([
      {
        prefix: '/'
      }
    ]),
    RouterModule.forRoot([
      { path: '', pathMatch: 'full', redirectTo: '/a'},
      { path: 'a', component: CompA},
      { path: 'b', component: CompB, canActivate: [CanActivateGuard]},
      { path: 'lazy', loadChildren: './lazy.module#LazyModule'}
    ])
  ],
  providers: [
    CanActivateGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
