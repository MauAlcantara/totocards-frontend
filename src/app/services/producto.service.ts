import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // La URL de tu backend en Express.js
  private apiUrl = 'http://localhost:3000/api/productos';

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
}