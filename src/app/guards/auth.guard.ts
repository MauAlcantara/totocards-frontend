import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaLogueado()) {
    return true; // El usuario tiene sesión, lo dejamos pasar
  } else {
    // Si intenta ingresar de forma directa a una ruta protegida (ej: /checkout), 
    // lo redirigimos al login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};