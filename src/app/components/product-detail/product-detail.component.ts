import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router'; 
import { ProductoService } from '../../services/producto.service';
import { CartService } from '../../services/cart.service'; 
import { ToastService } from '../../services/toast.service'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  producto: any = null;
  cargando: boolean = true;
  cantidadSeleccionada: number = 1;
  mostrarModalLogin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private productoService: ProductoService,
    private cartService: CartService,
    private toastService: ToastService,
    public authService: AuthService,
    private router: Router           
  ) {}

  ngOnInit(): void {
    const idProducto = this.route.snapshot.paramMap.get('id');
    
    if (idProducto) {
      this.productoService.obtenerProductoPorId(idProducto).subscribe({
        next: (datos) => {
          this.producto = datos; 
          this.cargando = false; 
        },
        error: (err) => {
          console.error('Error al cargar el detalle del producto:', err);
          this.cargando = false;
        }
      });
    }  
  }

  aumentarCantidad(): void {
    const maximo = this.obtenerMaximoPermitido();
    if (this.producto && this.cantidadSeleccionada < maximo) {
      this.cantidadSeleccionada++;
    }
  }


  disminuirCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
    }
  }

  
agregarItem(): void {
    if (!this.authService.estaLogueado()) {
      this.mostrarModalLogin = true;
      return;
    }

    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario?.roles?.includes('Administrador')) {
      this.toastService.mostrar('Los administradores no pueden realizar compras en la tienda.', 'error');
      return;
    }

    if (this.producto && this.producto.stock > 0) {
      // 1. Verificamos cuántos hay en el carrito actualmente
      const carritoActual = this.cartService.obtenerCarrito();
      const itemEnCarrito = carritoActual.find(item => item.id_producto === this.producto.id_producto);
      const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;
      const maximoPermitido = this.obtenerMaximoPermitido();

      // 2. Si ya llegó al límite, bloqueamos y mandamos la advertencia
      if (cantidadActual >= maximoPermitido) {
        if (this.producto.estado === 'PREVENTA') {
          this.toastService.mostrar('Tienes el máximo permitido de preventas (2) en tu carrito.', 'error');
        } else {
          this.toastService.mostrar('Ya has agregado todo el stock disponible a tu carrito.', 'error');
        }
        return; // Detenemos la ejecución aquí
      }

      // 3. Ajustamos por si intenta agregar de golpe más de lo que le queda permitido
      let cantidadAAgregar = this.cantidadSeleccionada;
      let avisoExtra = '';
      if (cantidadActual + cantidadAAgregar > maximoPermitido) {
        cantidadAAgregar = maximoPermitido - cantidadActual;
        avisoExtra = ` (Ajustado al límite permitido)`;
      }

      // 4. Agregamos al carrito e imprimimos el éxito real
      this.cartService.agregarAlCarrito(this.producto, cantidadAAgregar);
      
      if (this.producto.estado === 'PREVENTA') {
        this.toastService.mostrar(`Reserva asegurada: ${cantidadAAgregar}x ${this.producto.nombre}${avisoExtra}`, 'success');
      } else {
        this.toastService.mostrar(`Articulo añadido: ${cantidadAAgregar}x ${this.producto.nombre}${avisoExtra}`, 'success');
      }
      
      this.cantidadSeleccionada = 1; 
    }
  }

  validarCantidad(event: any): void {
    let valorEscrito = parseInt(event.target.value, 10);
    const maximo = this.obtenerMaximoPermitido();

    if (isNaN(valorEscrito) || valorEscrito < 1) {
      this.cantidadSeleccionada = 1;
    } 
    else if (valorEscrito > maximo) {
      this.cantidadSeleccionada = maximo;
    } 
    else {
      this.cantidadSeleccionada = valorEscrito;
    }

    event.target.value = this.cantidadSeleccionada;
  }
  cerrarModalLogin(): void {
    this.mostrarModalLogin = false;
  }

  // Calcula el límite permitido
  obtenerMaximoPermitido(): number {
    if (!this.producto) return 1;
    const limitePreventa = this.producto.estado === 'PREVENTA' ? 2 : this.producto.stock;
    return Math.min(this.producto.stock, limitePreventa);
  }
}

