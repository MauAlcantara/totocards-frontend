import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; 
import { ProductoService } from '../../services/producto.service';
import { CartService } from '../../services/cart.service'; 
import { ToastService } from '../../services/toast.service'; 

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
  
  // 1. NUEVA VARIABLE: Controla el número del contador
  cantidadSeleccionada: number = 1;

  constructor(
    private route: ActivatedRoute,
    private productoService: ProductoService,
    private cartService: CartService,
    private toastService: ToastService,
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

  // 2. NUEVA FUNCIÓN: Sube la cantidad, pero topa con el límite de stock
  aumentarCantidad(): void {
    if (this.producto && this.cantidadSeleccionada < this.producto.stock) {
      this.cantidadSeleccionada++;
    }
  }

  // 3. NUEVA FUNCIÓN: Baja la cantidad, pero nunca menos de 1
  disminuirCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
    }
  }

  // 4. ACTUALIZADA: Ahora envía la "cantidadSeleccionada" en lugar de un "1" fijo
  agregarItem(): void {
    if (this.producto && this.producto.stock > 0) {
      this.cartService.agregarAlCarrito(this.producto, this.cantidadSeleccionada);
      this.toastService.mostrar(`Articulo añadido: ${this.cantidadSeleccionada}x ${this.producto.nombre}`, 'success');
      
      // Opcional: Reiniciamos el contador a 1 después de añadir al carrito
      this.cantidadSeleccionada = 1; 
    }
  }
}