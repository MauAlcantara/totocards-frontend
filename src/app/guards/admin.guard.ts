import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService); 
  
  const usuario = authService.obtenerUsuarioActual();

  if (authService.estaLogueado() && usuario?.roles?.includes('Administrador')) {
    return true; 
  } else {
    toastService.mostrar('Acceso Denegado: Privilegios insuficientes.', 'error');
    router.navigate(['/']);
    return false;
  }
};