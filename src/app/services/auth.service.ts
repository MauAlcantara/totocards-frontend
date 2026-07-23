import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; // 1. Agregamos esto
import { isPlatformBrowser } from '@angular/common'; // 2. Agregamos esto
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  // 3. Inyectamos la plataforma y el http
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
        // 4. Protegemos la escritura al hacer login
        if (res.token && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('tototoken', res.token);
          localStorage.setItem('totouser', JSON.stringify(res.usuario));
        }
      })
    );
  }

  // 5. Protegemos la lectura continua (esta es la que rompía el Header)
  estaLogueado(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('tototoken');
    }
    return false; // Si está en el servidor, asume que no está logueado
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