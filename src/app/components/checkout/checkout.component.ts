import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { CartService } from '../../services/cart.service'; // Importar el carrito

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  carrito: any[] = [];
  total: number = 0;
  cargando: boolean = false;
  mensaje: string = '';

  constructor(
    private pedidoService: PedidoService, 
    private cartService: CartService, // Inyectamos el carrito
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Escuchamos el carrito real asíncronamente
    this.cartService.carrito$.subscribe(items => {
      this.carrito = items;
      this.calcularTotal();
    });
  }

  calcularTotal(): void {
    this.total = this.carrito.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
  }

  // Nueva función por si el usuario quiere arrepentirse y quitar un item desde la pasarela
  quitarItem(id_producto: number): void {
    this.cartService.eliminarDelCarrito(id_producto);
  }

  pagar(): void {
    if (this.carrito.length === 0) return;

    this.cargando = true;
    this.mensaje = '';

    const payload = {
      items: this.carrito,
      total: this.total
    };

    this.pedidoService.procesarCheckout(payload).subscribe({
      next: (res) => {
        this.cargando = false;
        this.mensaje = '✅ ' + res.mensaje;
        
        // 2. CRÍTICO: Si el banco de datos aprobó la compra, vaciamos el carrito local
        this.cartService.limpiarCarrito(); 
        
        setTimeout(() => this.router.navigate(['/']), 3000);
      },
      error: (err) => {
        this.cargando = false;
        this.mensaje = '❌ ' + (err.error?.mensaje || 'Error inesperado al procesar la compra.');
      }
    });
  }
}