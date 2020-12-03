import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RemultModule } from '@remult/angular';
import { UsersComponent } from './users/users.component';
import { UpdateInfoComponent } from './users/update-info/update-info.component';
import { RegisterComponent } from './users/register/register.component';
import { HomeComponent } from './home/home.component';
import { YesNoQuestionComponent } from './common/yes-no-question/yes-no-question.component';
import { SignInComponent } from './common/sign-in/sign-in.component';
import { InputAreaComponent } from './common/input-area/input-area.component';
import { DialogService } from './common/dialog';
import { AdminGuard } from './users/roles';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CtrlGComponent } from './ctrl-g/ctrl-g.component';
import { MainComponent } from './main/main.component';
import { ChooseFamilyMemberComponent } from './choose-family-member/choose-family-member.component';
import { ParentViewComponent } from './parent-view/parent-view.component';
import { ParentChildViewComponent } from './parent-child-view/parent-child-view.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ChildComponent } from './child/child.component';
import { ServerEventsService } from './server/server-events-service';

import { TransactionsComponent } from './transactions/transactions.component';

@NgModule({
  declarations: [
    MainComponent,
    AppComponent,
    UsersComponent,
    UpdateInfoComponent,
    RegisterComponent,
    HomeComponent,
    YesNoQuestionComponent,
    SignInComponent,
    InputAreaComponent,
    CtrlGComponent,
    ChooseFamilyMemberComponent,
    ParentViewComponent,
    ParentChildViewComponent,
    ChildComponent,
    
    TransactionsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RemultModule,
    BrowserAnimationsModule,
    MatTabsModule
  ],
  providers: [DialogService, AdminGuard,ServerEventsService],
  bootstrap: [MainComponent],
  entryComponents: [YesNoQuestionComponent, SignInComponent, InputAreaComponent]
})
export class AppModule { }
