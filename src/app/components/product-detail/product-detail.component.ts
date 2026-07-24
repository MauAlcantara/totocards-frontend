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

  aumentarCantidad(): void {
    if (this.producto && this.cantidadSeleccionada < this.producto.stock) {
      this.cantidadSeleccionada++;
    }
  }


  disminuirCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
    }
  }

  
  agregarItem(): void {
    if (this.producto && this.producto.stock > 0) {
      this.cartService.agregarAlCarrito(this.producto, this.cantidadSeleccionada);
      this.toastService.mostrar(`Articulo añadido: ${this.cantidadSeleccionada}x ${this.producto.nombre}`, 'success');
      this.cantidadSeleccionada = 1; 
    }
  }
  validarCantidad(event: any): void {
    let valorEscrito = parseInt(event.target.value, 10);

    if (isNaN(valorEscrito) || valorEscrito < 1) {
      this.cantidadSeleccionada = 1;
    } 
    else if (valorEscrito > this.producto.stock) {
      this.cantidadSeleccionada = this.producto.stock;
    } 
    else {
      this.cantidadSeleccionada = valorEscrito;
    }

    event.target.value = this.cantidadSeleccionada;
  }
}

