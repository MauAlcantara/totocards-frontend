import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service'; 
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs'; // 🔥 Importamos 'of'
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  // Menús
  menuAbierto: boolean = false;
  perfilMenuAbierto: boolean = false; 
  
  // Carrito y Búsqueda
  totalItems: number = 0; 
  mostrarModalLogin: boolean = false; 
  resultadosBusqueda: any[] = [];
  mostrarDropdown: boolean = false;
  private busquedaSubject = new Subject<string>();

  constructor(
    private productoService: ProductoService,
    public authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Motor Predictivo
    this.busquedaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((termino) => {
        if (termino.trim() === '') {
          this.mostrarDropdown = false;
          return of([]); // 🔥 CORRECCIÓN 1: Vercel exige retornar un Observable, no un array crudo '[]'
        }
        return this.productoService.buscarProductos(termino);
      })
    ).subscribe({
      next: (resultados) => {
        this.resultadosBusqueda = resultados;
        this.mostrarDropdown = true; 
      },
      error: (err) => console.error('Error buscando', err)
    });

    // 🔥 CORRECCIÓN 2: Tipamos 'items' y 'item' como 'any' para que Vercel reconozca '.cantidad'
    this.cartService.carrito$.subscribe((items: any[]) => {
      this.totalItems = items.reduce((acc, item: any) => acc + item.cantidad, 0);
    });
  }

  // ==========================================
  // FUNCIONES DE MENÚS Y SESIÓN
  // ==========================================
  
  abrirMenu(): void { this.menuAbierto = true; }
  cerrarMenu(): void { this.menuAbierto = false; }

  abrirMenuPerfil(): void { this.perfilMenuAbierto = true; }
  cerrarMenuPerfil(): void { this.perfilMenuAbierto = false; }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.cerrarMenuPerfil(); 
    this.router.navigate(['/']); 
  }

  // ==========================================
  // FUNCIONES DEL CARRITO Y BÚSQUEDA
  // ==========================================
  
  onCarritoClick(): void {
    if (this.authService.estaLogueado()) {
      this.router.navigate(['/checkout']); 
    } else {
      this.mostrarModalLogin = true;
    }
  }

  cerrarModalLogin(): void { this.mostrarModalLogin = false; }

  onBuscar(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.busquedaSubject.next(valor);
    if (valor.trim() === '') {
       this.mostrarDropdown = false;
    }
  }

  onBlur(inputElement: HTMLInputElement): void {
    setTimeout(() => {
      this.cerrarBuscador(inputElement);
    }, 200);
  }

  cerrarBuscador(inputElement: HTMLInputElement): void {
    this.mostrarDropdown = false;
    this.resultadosBusqueda = [];
    inputElement.value = ''; 
  }
}