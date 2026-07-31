import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router} from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service'; 
import { AuthService } from '../../services/auth.service'; // 🔥 Agregamos AuthService

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  inventario: any[] = [];
  esFinDeSemana: boolean = false;
  mostrarModalLogin: boolean = false; 

  constructor
    (private productoService: ProductoService,
    private cartService: CartService,
    private toastService: ToastService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // --- 1. LÓGICA DEL EVENTO CALENDARIZADO (DÍA DE LA SEMANA) ---
    const fechaActual = new Date();
    const diaSemana = fechaActual.getDay();
    
    if (diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
      this.esFinDeSemana = true;
    }

    // --- 2. CARGA DE BASE DE DATOS ---
this.productoService.obtenerProductos().subscribe({
      next: (datosBackend) => {
        this.inventario = datosBackend.filter((prod: any) => prod.estado !== 'PREVENTA');
        console.log('Catálogo cargado y filtrado:', this.inventario);
      },
      error: (error) => {
        console.error('Error al obtener los productos', error);
      }
    });
  }
agregarItem(producto: any): void {
    if (!this.authService.estaLogueado()) {
      this.mostrarModalLogin = true;
      return; 
    }

    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario?.roles?.includes('Administrador')) {
      this.toastService.mostrar('Los administradores no pueden realizar compras en la tienda.', 'error');
      return; 
    }

    if (producto && producto.stock > 0) {
      // 1. Verificamos el límite
      const carritoActual = this.cartService.obtenerCarrito();
      const itemEnCarrito = carritoActual.find(item => item.id_producto === producto.id_producto);
      const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;
      const maximoPermitido = producto.estado === 'PREVENTA' ? 2 : producto.stock;

      // 2. Bloqueo si ya está en el límite
      if (cantidadActual >= maximoPermitido) {
        if (producto.estado === 'PREVENTA') {
          this.toastService.mostrar('Tienes el máximo permitido de preventas (2) en tu carrito.', 'error');
        } else {
          this.toastService.mostrar('Ya tienes todo el stock disponible en tu carrito.', 'error');
        }
        return; 
      }

      // 3. Flujo normal (Como en el catálogo siempre se agrega de 1 en 1, es directo)
      this.cartService.agregarAlCarrito(producto, 1);
      
      if (producto.estado === 'PREVENTA') {
        this.toastService.mostrar(`Reserva asegurada: 1x ${producto.nombre}`, 'success');
      } else {
        this.toastService.mostrar(`Articulo añadido: 1x ${producto.nombre}`, 'success');
      }
    } else {
      this.toastService.mostrar('Este artículo está agotado por el momento.', 'error');
    }
  }
  
  cerrarModalLogin(): void {
    this.mostrarModalLogin = false;
  }
}