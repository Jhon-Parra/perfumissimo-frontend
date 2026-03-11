import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard
 * Función Standalone de Angular que verifica si el usuario está completamente autenticado en el sistema.
 * 
 * Uso en App Routing: 
 * { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Validaciones del guard (token valido y existente)
    if (authService.isAuthenticated()) {
        return true; // Permitir el flujo
    }

    // Guardando la URL a la que se intentaba acceder para redirección post-login
    // Esto es parte de un flujo correcto y pulido UX para E-Commerce de alta gama.
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });

    return false;
};
