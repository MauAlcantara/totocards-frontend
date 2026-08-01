import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'https://totocards-backend.onrender.com/api/pedidos';

  constructor(private http: HttpClient) {}

  procesarCheckout(pedido: any): Observable<any> {
    // Obtenemos el token guardado del login
    const token = localStorage.getItem('tototoken');
    
    // Lo adjuntamos a las cabeceras HTTP por seguridad
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.post(`${this.apiUrl}/checkout`, pedido, { headers });
  }
  obtenerDetallePedido(id: number | string): Observable<any> {
    const token = localStorage.getItem('tototoken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/${id}`, { headers });
  }
}