import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit {
  pedidos: any[] = [];
  cargando: boolean = true;
  errorMensaje: string = '';

  constructor(
    private pedidoService: PedidoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.cargando = false;
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    this.pedidoService.obtenerMisCompras()
      .subscribe({
        next: (data) => {
          this.pedidos = data || [];
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al obtener compras de la base de datos:', err);
          this.pedidos = [];
          this.errorMensaje = 'No se pudo conectar con el servidor para consultar tu historial. Intenta nuevamente.';
          this.cargando = false;
        }
      });
  }

  formatearCodigoOrden(id: number | string): string {
    if (!id) return 'TCG-0000';
    if (typeof id === 'string' && id.includes('TCG')) {
      return id;
    }
    const numeroFormateado = String(id).padStart(4, '0');
    return `TCG-${numeroFormateado}`;
  }
}