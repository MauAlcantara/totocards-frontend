import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 🔥 Importamos FormsModule para binding de los selects
import { ProductoService } from '../../services/producto.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // 🔥 Agregamos FormsModule aquí
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  inventario: any[] = [];
  inventarioFiltrado: any[] = []; // 🔥 Lista dinámica que se muestra en el HTML
  esFinDeSemana: boolean = false;
  mostrarModalLogin: boolean = false;

  // 🔥 Variables de estado para los filtros
  categoriaSeleccionada: string = '';
  coleccionSeleccionada: string = '';
  ordenSeleccionado: string = 'default';

  // 🔥 Lista dinámica de colecciones/expansiones extraídas de la BD
  coleccionesDisponibles: string[] = [];

  constructor(
    private productoService: ProductoService,
    private cartService: CartService,
    private toastService: ToastService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const fechaActual = new Date();
    const diaSemana = fechaActual.getDay();
    
    if (diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
      this.esFinDeSemana = true;
    }

    this.productoService.obtenerProductos().subscribe({
      next: (datosBackend) => {
        // Filtrar productos que no sean preventas
        this.inventario = datosBackend.filter((prod: any) => prod.estado !== 'PREVENTA');
        
        // Extraemos dinámicamente las colecciones únicas presentes en la BD
        const coleccionesSet = new Set(this.inventario.map(p => p.expansion).filter(Boolean));
        this.coleccionesDisponibles = Array.from(coleccionesSet);

        // Inicialmente mostramos todo el inventario
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Error al obtener los productos', error);
      }
    });
  }

  // 🔥 LÓGICA DE FILTRADO Y ORDENAMIENTO DINÁMICO
  aplicarFiltros(): void {
    let resultado = [...this.inventario];

    // 1. Filtrar por Categoría
    if (this.categoriaSeleccionada) {
      resultado = resultado.filter(prod => {
        const catProd = (prod.categoria || '').toLowerCase();
        const nomProd = (prod.nombre || '').toLowerCase();
        const catFiltro = this.categoriaSeleccionada.toLowerCase();

        return catProd.includes(catFiltro) || nomProd.includes(catFiltro);
      });
    }

    // 2. Filtrar por Colección / Expansión
    if (this.coleccionSeleccionada) {
      resultado = resultado.filter(prod => 
        prod.expansion === this.coleccionSeleccionada
      );
    }

    // 3. Ordenar por Precio
    if (this.ordenSeleccionado === 'price-low') {
      resultado.sort((a, b) => Number(a.precio) - Number(b.precio));
    } else if (this.ordenSeleccionado === 'price-high') {
      resultado.sort((a, b) => Number(b.precio) - Number(a.precio));
    } else {
      // Default: Disponibles primero, luego agotados
      resultado.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));
    }

    this.inventarioFiltrado = resultado;
  }

  // Limpiar todos los filtros con un clic
  limpiarFiltros(): void {
    this.categoriaSeleccionada = '';
    this.coleccionSeleccionada = '';
    this.ordenSeleccionado = 'default';
    this.aplicarFiltros();
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
      const carritoActual = this.cartService.obtenerCarrito();
      const itemEnCarrito = carritoActual.find(item => item.id_producto === producto.id_producto);
      const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;
      const maximoPermitido = producto.estado === 'PREVENTA' ? 2 : producto.stock;

      if (cantidadActual >= maximoPermitido) {
        if (producto.estado === 'PREVENTA') {
          this.toastService.mostrar('Tienes el máximo permitido de preventas (2) en tu carrito.', 'error');
        } else {
          this.toastService.mostrar('Ya tienes todo el stock disponible en tu carrito.', 'error');
        }
        return; 
      }

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