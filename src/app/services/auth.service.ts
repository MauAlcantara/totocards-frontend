import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; 
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private usuarioSubject = new BehaviorSubject<any>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  private logueadoSubject = new BehaviorSubject<boolean>(false);
  public estaLogueado$ = this.logueadoSubject.asObservable();

  public esAdmin$ = this.usuario$.pipe(
    map(u => Array.isArray(u?.roles) && u.roles.includes('Administrador'))
  );

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.sincronizarEstadoReactivo();
    }
  }

  private sincronizarEstadoReactivo(): void {
    const usuario = this.obtenerUsuarioActual();
    this.usuarioSubject.next(usuario);
    this.logueadoSubject.next(!!usuario);
  }

  registrar(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, usuario);
  }

  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales).pipe(
      tap((res: any) => {
        if (res.token && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('tototoken', res.token);
          localStorage.setItem('totouser', JSON.stringify(res.usuario));
          this.sincronizarEstadoReactivo();
        }
      })
    );
  }

  actualizarPerfil(datos: { nombre: string, avatar?: string | null }): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar-perfil`, datos);
  }

  actualizarUsuarioLocal(datos: { nombre: string, avatar?: string | null }): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const stored = localStorage.getItem('totouser');
      const perfilActual = stored ? JSON.parse(stored) : {};
      const perfilActualizado = { ...perfilActual, ...datos };
      localStorage.setItem('totouser', JSON.stringify(perfilActualizado));
      this.sincronizarEstadoReactivo();
    } catch (e) {
      console.error('Error al actualizar almacenamiento local del usuario:', e);
    }
  }

  private decodificarToken(token: string): any {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  obtenerPayloadToken(): any {
    if (!isPlatformBrowser(this.platformId)) return null;
    const token = localStorage.getItem('tototoken');
    if (!token) return null;

    const payload = this.decodificarToken(token);
    if (!payload) {
      this.cerrarSesion();
      return null;
    }

    // Verificar si el token ya expiró
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      this.cerrarSesion();
      return null;
    }

    return payload;
  }

  estaLogueado(): boolean {
    return !!this.obtenerPayloadToken();
  }

  obtenerRoles(): string[] {
    const payload = this.obtenerPayloadToken();
    return Array.isArray(payload?.roles) ? payload.roles : [];
  }

  esAdmin(): boolean {
    return this.obtenerRoles().includes('Administrador');
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('tototoken');
      localStorage.removeItem('totouser');
      this.usuarioSubject.next(null);
      this.logueadoSubject.next(false);
    }
  }

  obtenerUsuarioActual() {
    if (!isPlatformBrowser(this.platformId)) return null;
    const payload = this.obtenerPayloadToken();
    if (!payload) return null;

    let perfilLocal: any = null;
    try {
      const stored = localStorage.getItem('totouser');
      if (stored) perfilLocal = JSON.parse(stored);
    } catch {
      perfilLocal = null;
    }

    // Los roles, id y email provienen estrictamente del token JWT firmado
    return {
      ...(perfilLocal || {}),
      id: payload.id,
      id_usuario: payload.id,
      email: payload.email,
      nombre: payload.nombre || perfilLocal?.nombre,
      roles: payload.roles || [],
      permisos: payload.permisos || []
    };
  }
}