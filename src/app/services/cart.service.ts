import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; // 1. Agregamos Inject y PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // 2. Importamos el verificador
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private carritoSubject = new BehaviorSubject<any[]>([]);
  public carrito$: Observable<any[]> = this.carritoSubject.asObservable();

  // 3. Inyectamos el ID de la plataforma en el constructor
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    
    // 4. Envolvemos la lectura en un IF protector
    if (isPlatformBrowser(this.platformId)) {
      const carritoGuardado = localStorage.getItem('totocart');
      if (carritoGuardado) {
        this.carritoSubject.next(JSON.parse(carritoGuardado));
      }
    }
  }

  obtenerCarrito(): any[] {
    return this.carritoSubject.value;
  }

  agregarAlCarrito(producto: any, cantidad: number = 1): void {
    const carritoActual = [...this.obtenerCarrito()];
    const itemExistente = carritoActual.find(item => item.id_producto === producto.id_producto);

    if (itemExistente) {
      if (itemExistente.cantidad + cantidad <= producto.stock) {
        itemExistente.cantidad += cantidad;
      } else {
        itemExistente.cantidad = producto.stock; 
      }
    } else {
      carritoActual.push({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio_unitario: parseFloat(producto.precio),
        cantidad: cantidad,
        imagen_url: producto.imagen_url,
        stock: producto.stock 
      });
    }

    this.actualizarEstado(carritoActual);
  }

  eliminarDelCarrito(id_producto: number): void {
    const carritoActual = this.obtenerCarrito().filter(item => item.id_producto !== id_producto);
    this.actualizarEstado(carritoActual);
  }

  limpiarCarrito(): void {
    this.actualizarEstado([]);
  }

  // 5. Protegemos también la escritura
  private actualizarEstado(nuevoCarrito: any[]): void {
    this.carritoSubject.next(nuevoCarrito);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('totocart', JSON.stringify(nuevoCarrito));
    }
  }
}