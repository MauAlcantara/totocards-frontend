import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { CartService } from '../../services/cart.service'; 

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  carrito: any[] = [];
  subtotal: number = 0;
  descuentoEtb: number = 0;
  costoEnvio: number = 0;
  envioGratisVerano: boolean = false;
  total: number = 0;

  cargando: boolean = false;
  mensaje: string = '';

  constructor(
    private pedidoService: PedidoService, 
    private cartService: CartService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.carrito$.subscribe(items => {
      this.carrito = items;
      this.calcularTotal();
    });
  }

calcularTotal(): void {
    const fechaActual = new Date();
    const diaSemana = fechaActual.getDay();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();

    const esFinDeSemana = (diaSemana === 5 || diaSemana === 6 || diaSemana === 0);
    
    this.envioGratisVerano = (anioActual === 2026 && mesActual >= 5 && mesActual <= 7);

    this.subtotal = 0;
    this.descuentoEtb = 0;

    this.carrito.forEach(item => {
      this.subtotal += (item.precio_unitario * item.cantidad);

      if (esFinDeSemana && item.nombre.toLowerCase().includes('elite trainer box')) {
        this.descuentoEtb += (item.precio_unitario * 0.10) * item.cantidad; 
      }
    });

    this.costoEnvio = this.envioGratisVerano ? 0 : 150.00; 

    this.total = this.subtotal - this.descuentoEtb + this.costoEnvio;
  }

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