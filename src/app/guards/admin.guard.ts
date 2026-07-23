import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService); // Inyectar el servicio
  
  const usuario = authService.obtenerUsuarioActual();

  // Verificamos si el usuario existe y si dentro de su arreglo de roles viene 'Administrador'
  if (authService.estaLogueado() && usuario?.roles?.includes('Administrador')) {
    return true; // Es un admin real, lo dejamos pasar
  } else {
    // Si es un cliente común intentando hackear la URL, lo mandamos al Home
    toastService.mostrar('Acceso Denegado: Privilegios insuficientes.', 'error');
    router.navigate(['/']);
    return false;
  }
};