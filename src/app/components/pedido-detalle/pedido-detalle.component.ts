import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pedido-detalle.component.html',
  styleUrls: ['./pedido-detalle.component.css']
})
export class PedidoDetalleComponent implements OnInit {
  pedido: any = null;
  detalles: any[] = [];
  cargando: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pedidoService.obtenerDetallePedido(id).subscribe({
        next: (data) => {
          this.pedido = data.pedido;
          this.detalles = data.detalles;
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'No se pudo cargar el detalle del pedido.';
          this.cargando = false;
        }
      });
    }
  }

  // Reciclamos la misma función para mantener la elegancia de los IDs
  formatearCodigoOrden(id: number): string {
    return `TCG-${String(id).padStart(4, '0')}`;
  }
}