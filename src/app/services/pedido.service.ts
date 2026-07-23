import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'http://localhost:3000/api/pedidos';

  constructor(private http: HttpClient) {}

  procesarCheckout(pedido: any): Observable<any> {
    // Obtenemos el token guardado del login
    const token = localStorage.getItem('tototoken');
    
    // Lo adjuntamos a las cabeceras HTTP por seguridad
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.post(`${this.apiUrl}/checkout`, pedido, { headers });
  }
}