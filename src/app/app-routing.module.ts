import { RemultModule, NotSignedInGuard, SignedInGuard } from '@remult/angular';
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { Routes, RouterModule, Route, ActivatedRouteSnapshot } from '@angular/router';
import { HomeComponent } from './home/home.component';

import { RegisterComponent } from './users/register/register.component';
import { UpdateInfoComponent } from './users/update-info/update-info.component';

import { UsersComponent } from './users/users.component';
import { Roles, AdminGuard } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { CtrlGComponent } from './ctrl-g/ctrl-g.component';
import { Context } from '@remult/core';
import { ServerSignIn } from './users/server-sign-in';


const routes: Routes = [
  { path: 'Home', component: HomeComponent },
  { path: 'ctrlg', component: CtrlGComponent },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard] },

  { path: 'Register', component: RegisterComponent, canActivate: [NotSignedInGuard] },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard] },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes), RemultModule],
  providers: [AdminGuard, { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }
    ,
    {
      provide: APP_INITIALIZER,
      deps: [Context],
      useFactory: initApp,
      multi: true,

    }],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export function initApp(context: Context) {
  return async () => {
    const user = await ServerSignIn.validateToken();
    if (user) {
      context._setUser(user);
    }
    else {
      let t = localStorage.getItem('token');
      if (t) {
        let user = await HomeComponent.signInWithInvite(t);
        if (user) {
          context._setUser(user);
          localStorage.removeItem('token');
        }
      }

    }
  }
}
