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
  // Inicialmente no hay producto (null) y mostramos un estado de carga
  producto: any = null;
  cargando: boolean = true;

  // Inyectamos ActivatedRoute y nuestro Servicio
  constructor(
    private route: ActivatedRoute,
    private productoService: ProductoService,
    private cartService: CartService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    // 1. Capturar el "id" que viene en la URL (ejemplo: /producto/3)
    const idProducto = this.route.snapshot.paramMap.get('id');
    

    if (idProducto) {
      // 2. Pedirle al backend los datos de ese ID específico
      this.productoService.obtenerProductoPorId(idProducto).subscribe({
        next: (datos) => {
          this.producto = datos; // Llenamos nuestra variable con la info de Postgres
          this.cargando = false; // Quitamos el estado de carga
        },
        error: (err) => {
          console.error('Error al cargar el detalle del producto:', err);
          this.cargando = false;
        }
      });
      
    }  
  }
  agregarItem(): void {
    if (this.producto && this.producto.stock > 0) {
      this.cartService.agregarAlCarrito(this.producto, 1);
    this.toastService.mostrar(`Articulo añadido: ${this.producto.nombre}`, 'success');
    }
  }
}