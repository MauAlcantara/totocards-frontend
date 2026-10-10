import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  procesarCheckout(pedido: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkout`, pedido);
  }

  obtenerMisCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-compras`);
  }

  obtenerDetallePedido(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
}