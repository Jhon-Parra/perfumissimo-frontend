import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Obtener token (Si estamos en el navegador)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    if (token) {
        // Clonar la solicitud y adjuntar el encabezado Authorization
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    }

    return next(req);
};
