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
    // 1. Validar si NO ha iniciado sesión (Invitado)
    if (!this.authService.estaLogueado()) {
      this.mostrarModalLogin = true;
      return; // Detiene la función
    }

    // 2. Validar si es Administrador
    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario?.roles?.includes('Administrador')) {
      this.toastService.mostrar('Los administradores no pueden realizar compras en la tienda.', 'error');
      return; // Detiene la función
    }

    // 3. Si es un usuario normal y hay stock, pasa al carrito
    if (producto && producto.stock > 0) {
      this.cartService.agregarAlCarrito(producto, 1);
      this.toastService.mostrar(`Articulo añadido: 1x ${producto.nombre}`, 'success');
    } else {
      this.toastService.mostrar('Este artículo está agotado por el momento.', 'error');
    }
  }
  
  cerrarModalLogin(): void {
    this.mostrarModalLogin = false;
  }
}