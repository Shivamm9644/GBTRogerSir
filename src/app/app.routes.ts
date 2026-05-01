import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { LoginComponent }           from './pages/login/login';
import { DashboardComponent }        from './pages/dashboard/dashboard';
import { UsersComponent }            from './pages/users/users';
import { AlertsComponent }           from './pages/alerts/alerts';
import { DevelopmentComponent }      from './pages/development/development';
import { AppsComponent }             from './pages/apps/apps';
import { ArchiveComponent }          from './pages/archive/archive';
import { CustomerDashboardComponent }from './pages/customer-dashboard/customer-dashboard';
import { ContactsComponent }         from './pages/contacts/contacts';
import { ServersComponent }          from './pages/servers/servers';
import { FinanceComponent }          from './pages/finance/finance';
import { CompaniesComponent }        from './pages/companies/companies';
import { CompanyDetailComponent }    from './pages/company-detail/company-detail';
import { CompanyDashboardComponent } from './pages/company-detail/company-dashboard';
import { CompanyContactsComponent }  from './pages/company-detail/company-contacts';
import { CompanyServersComponent }   from './pages/company-detail/company-servers';
import { CompanyFinanceComponent }   from './pages/company-detail/company-finance';
import { FirmwareComponent }         from './pages/firmware/firmware';
import { FileExplorerComponent }     from './pages/file-explorer/file-explorer';
import { SelectAppComponent }       from './pages/select-app/select-app';

export const routes: Routes = [
    // ── Public ──────────────────────────────────────────────────────────────
    { path: 'login', component: LoginComponent },

    // ── Protected (all require auth) ─────────────────────────────────────────
    { path: '',             redirectTo: 'select-app', pathMatch: 'full' },
    { path: 'select-app',   component: SelectAppComponent,        canActivate: [authGuard] },
    { path: 'dashboard',    component: DashboardComponent,        canActivate: [authGuard] },
    { path: 'users',        component: UsersComponent,            canActivate: [authGuard] },
    { path: 'alerts',       component: AlertsComponent,           canActivate: [authGuard] },
    { path: 'development',  component: DevelopmentComponent,      canActivate: [authGuard] },
    { path: 'apps',         component: AppsComponent,             canActivate: [authGuard] },
    { path: 'firmware',     component: FirmwareComponent,         canActivate: [authGuard] },
    { path: 'file-explorer',component: FileExplorerComponent,     canActivate: [authGuard] },
    { path: 'archive',      component: ArchiveComponent,          canActivate: [authGuard] },
    { path: 'customer-dashboard', component: CustomerDashboardComponent, canActivate: [authGuard] },
    { path: 'contacts',     component: ContactsComponent,         canActivate: [authGuard] },
    { path: 'servers',      component: ServersComponent,          canActivate: [authGuard] },
    { path: 'finance',      component: FinanceComponent,          canActivate: [authGuard] },
    { path: 'companies',    component: CompaniesComponent,        canActivate: [authGuard] },
    {
        path: 'companies/:id',
        component: CompanyDetailComponent,
        canActivate: [authGuard],
        children: [
            { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: CompanyDashboardComponent },
            { path: 'contacts',  component: CompanyContactsComponent  },
            { path: 'servers',   component: CompanyServersComponent   },
            { path: 'finance',   component: CompanyFinanceComponent   },
        ]
    },
    { path: '**', redirectTo: 'dashboard' }
];
