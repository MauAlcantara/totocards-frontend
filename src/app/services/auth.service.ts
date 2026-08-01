import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; 
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://totocards-backend.onrender.com/api/auth';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  registrar(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, usuario);
  }

  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales).pipe(
      tap((res: any) => {
        if (res.token && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('tototoken', res.token);
          localStorage.setItem('totouser', JSON.stringify(res.usuario));
        }
      })
    );
  }

  estaLogueado(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('tototoken');
    }
    return false; 
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('tototoken');
      localStorage.removeItem('totouser');
    }
  }

  obtenerUsuarioActual() {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('totouser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}