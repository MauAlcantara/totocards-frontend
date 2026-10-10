import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  let authReq = req;

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('tototoken');
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if ((error.status === 401 || error.status === 403) && isPlatformBrowser(platformId)) {
        if (error.status === 401 && !req.url.includes('/login') && !req.url.includes('/registro')) {
          localStorage.removeItem('tototoken');
          localStorage.removeItem('totouser');
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
