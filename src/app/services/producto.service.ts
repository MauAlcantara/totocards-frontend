import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'https://totocards-backend.onrender.com/api/productos';
  private adminUrl = 'https://totocards-backend.onrender.com/api/admin/productos';

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

  crearProducto(producto: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(this.adminUrl, producto, { headers });
  }

  actualizarProducto(id: number | string, producto: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.adminUrl}/${id}`, producto, { headers });
  }

  eliminarProducto(id: number | string, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.adminUrl}/${id}`, { headers });
  }
}
