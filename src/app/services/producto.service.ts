import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // La URL de tu backend en Express.js
  private apiUrl = 'https://totocards-backend.onrender.com/api/productos';
  private adminUrl = 'https://totocards-backend.onrender.com/api/admin/productos';

  constructor(private http: HttpClient) { }

  // Función asíncrona para obtener el catálogo
  obtenerProductos(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
  obtenerPreventas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/preventas`);
  }
  // Obtener una sola carta o caja usando su ID
  obtenerProductoPorId(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  // Función para la búsqueda predictiva
  buscarProductos(termino: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/buscar?q=${termino}`);
  }

// ==========================================
  // 🔥 NUEVOS MÉTODOS DE ADMINISTRADOR
  // ==========================================
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
