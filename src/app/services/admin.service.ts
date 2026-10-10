import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private adminUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  obtenerUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}/usuarios`);
  }

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(`${this.adminUrl}/usuarios`, usuario);
  }

  actualizarUsuario(id: number | string, usuario: any): Observable<any> {
    return this.http.put<any>(`${this.adminUrl}/usuarios/${id}`, usuario);
  }

  eliminarUsuario(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.adminUrl}/usuarios/${id}`);
  }

  cambiarEstadoUsuario(id: number | string, activo: boolean): Observable<any> {
    return this.http.put<any>(`${this.adminUrl}/usuarios/${id}/estado`, { activo });
  }

  obtenerMensajes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}/mensajes`);
  }

  marcarMensajeLeido(id: number | string): Observable<any> {
    return this.http.put<any>(`${this.adminUrl}/mensajes/${id}/leido`, {});
  }
}
