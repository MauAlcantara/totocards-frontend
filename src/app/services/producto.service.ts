import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/productos`;
  private adminUrl = `${environment.apiUrl}/admin/productos`;

  constructor(private http: HttpClient) { }

  obtenerProductos(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
  obtenerPreventas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/preventas`);
  }
  obtenerProductoPorId(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  buscarProductos(termino: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/buscar?q=${termino}`);
  }

  crearProducto(producto: any, token?: string): Observable<any> {
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.post(this.adminUrl, producto, options);
  }

  actualizarProducto(id: number | string, producto: any, token?: string): Observable<any> {
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.put(`${this.adminUrl}/${id}`, producto, options);
  }

  eliminarProducto(id: number | string, token?: string): Observable<any> {
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.delete(`${this.adminUrl}/${id}`, options);
  }
}
