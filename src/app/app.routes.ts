import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ProductsComponent } from './pages/admin/products/products.component';
import { SettingsComponent } from './pages/admin/settings/settings.component';
import { UsersComponent } from './pages/admin/users/users.component';
import { CatalogComponent } from './pages/store/catalog/catalog.component';
import { ContactComponent } from './pages/store/contact/contact.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    {
        path: 'checkout',
        component: CheckoutComponent,
        canActivate: [authGuard]
    },
    { path: 'login', component: LoginComponent },
    { path: 'catalog', component: CatalogComponent },
    { path: 'contact', component: ContactComponent },
    {
        path: 'admin',
        component: DashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['SUPERADMIN', 'ADMIN', 'VENTAS', 'PRODUCTOS'] }
    },
    {
        path: 'admin/products',
        component: ProductsComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['SUPERADMIN', 'ADMIN', 'PRODUCTOS'] }
    },
    {
        path: 'admin/settings',
        component: SettingsComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['SUPERADMIN', 'ADMIN'] }
    },
    {
        path: 'admin/users',
        component: UsersComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['SUPERADMIN'] }
    },
    { path: '**', redirectTo: '' }
];
