import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard
 * Función Standalone de Angular que verifica si un usuario autenticado 
 * además posee el acceso necesario (Rol) para la ruta.
 * 
 * Uso en App Routing (CMS): 
 * { 
 *   path: 'admin', 
 *   component: AdminLayoutComponent, 
 *   canActivate: [authGuard, roleGuard], 
 *   data: { role: 'ADMIN' } 
 * }
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Leer los roles necesarios provistos desde el data config de las rutas
    const expectedRoles = route.data['roles'] as string[];
    const currentRole = authService.getUserRole();

    if (!authService.isAuthenticated()) {
        router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }

    // Prevenir acceso si el rol actual no está en la lista de permitidos
    if (expectedRoles && expectedRoles.length > 0 && !expectedRoles.includes(currentRole)) {
        router.navigate(['/access-denied']);
        return false;
    }

    return true;

    return true;
};
