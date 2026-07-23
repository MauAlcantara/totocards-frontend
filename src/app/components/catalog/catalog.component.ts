import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
// import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  inventario: any[] = [];
  
  // Nueva variable para el evento de periodo (Oferta de Fin de Semana)
  esFinDeSemana: boolean = false;

  constructor
    (private productoService: ProductoService,
      // private cartService: CartService
  ) {}

  ngOnInit(): void {
    // --- 1. LÓGICA DEL EVENTO CALENDARIZADO (DÍA DE LA SEMANA) ---
    const fechaActual = new Date();
    const diaSemana = fechaActual.getDay(); // 0 = Domingo, 1 = Lunes, ..., 4 = Jueves, 5 = Viernes, 6 = Sábado
    
    // Si es Jueves (4), Viernes (5), Sábado (6) o Domingo (0), activamos la oferta.
    // (Puse el 4 para que hoy jueves puedas ver el resultado en tu pantalla)
    if (diaSemana === 4 || diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
      this.esFinDeSemana = true;
    }

    // --- 2. CARGA DE BASE DE DATOS ---
    this.productoService.obtenerProductos().subscribe({
      next: (datosBackend) => {
        this.inventario = datosBackend;
        console.log('Catálogo cargado desde la BD:', this.inventario);
      },
      error: (error) => {
        console.error('Error al obtener los productos', error);
      }
    });
  }
  //   agregarItem(): void {
  //   if (this.producto && this.producto.stock > 0) {
  //     this.cartService.agregarAlCarrito(this.producto, 1);
  //     alert(`¡${this.producto.nombre} añadida al carrito con éxito! 🃏`);
  //   }
  // }
}