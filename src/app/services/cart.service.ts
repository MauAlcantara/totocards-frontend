import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; 
import { isPlatformBrowser } from '@angular/common'; 
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private carritoSubject = new BehaviorSubject<any[]>([]);
  public carrito$: Observable<any[]> = this.carritoSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
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

    // 🔥 REGLA DE ORO: Si es preventa el límite máximo es 2, si no, es su stock real.
    const limiteMaximo = producto.estado === 'PREVENTA' ? 2 : producto.stock;

    if (itemExistente) {
      // Calculamos la suma de lo que YA tiene en el carrito + lo nuevo que intenta agregar
      const nuevaCantidad = itemExistente.cantidad + cantidad;
      
      if (nuevaCantidad <= limiteMaximo) {
        itemExistente.cantidad = nuevaCantidad;
      } else {
        // Si se pasa de listo, lo bloqueamos topándolo al límite máximo
        itemExistente.cantidad = limiteMaximo; 
      }
    } else {
      // Validamos que desde el primer clic no intenten inyectar una cantidad mayor
      const cantidadInicial = cantidad > limiteMaximo ? limiteMaximo : cantidad;
      
      carritoActual.push({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio_unitario: parseFloat(producto.precio),
        cantidad: cantidadInicial,
        imagen_url: producto.imagen_url,
        stock: producto.stock,
        estado: producto.estado // Guardamos el estado para usarlo en el front
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

  private actualizarEstado(nuevoCarrito: any[]): void {
    this.carritoSubject.next(nuevoCarrito);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('totocart', JSON.stringify(nuevoCarrito));
    }
  }
}