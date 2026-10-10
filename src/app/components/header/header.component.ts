import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service'; 
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, Subscription } from 'rxjs'; 
import { CartService } from '../../services/cart.service';
import { WearableService } from '../../services/wearable.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuAbierto: boolean = false;
  perfilMenuAbierto: boolean = false;
  totalItems: number = 0; 
  mostrarModalLogin: boolean = false; 
  resultadosBusqueda: any[] = [];
  mostrarDropdown: boolean = false;
  
  // Estado reactivo para evitar anti-patrón de getters en templates
  puedeVerCarrito: boolean = false;
  usuarioActual: any = null;

  private busquedaSubject = new Subject<string>();
  private subscripciones = new Subscription();
  
  constructor(
    private productoService: ProductoService,
    public authService: AuthService,
    private cartService: CartService,
    private router: Router,
    public wearableService: WearableService
  ) { }

  ngOnInit(): void {
    // Sincronización reactiva del usuario y visibilidad del carrito (0 accesos a localStorage en CD)
    this.subscripciones.add(
      this.authService.usuario$.subscribe((usuario) => {
        this.usuarioActual = usuario;
        const estaLogueado = !!usuario;
        const esAdmin = Array.isArray(usuario?.roles) && usuario.roles.includes('Administrador');
        this.puedeVerCarrito = estaLogueado && !esAdmin;
      })
    );

    // Búsqueda predictiva optimizada
    this.subscripciones.add(
      this.busquedaSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((termino) => {
          if (!termino || termino.trim() === '') {
            this.mostrarDropdown = false;
            return of([]);
          }
          return this.productoService.buscarProductos(termino);
        })
      ).subscribe({
        next: (resultados) => {
          this.resultadosBusqueda = resultados;
          this.mostrarDropdown = true; 
        },
        error: (err) => console.error('Error buscando', err)
      })
    );

    // Carrito reactivo
    this.subscripciones.add(
      this.cartService.carrito$.subscribe((items: any[]) => {
        this.totalItems = items.reduce((acc, item: any) => acc + item.cantidad, 0);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscripciones.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.cerrarModalLogin();
    this.cerrarMenu();
    this.cerrarMenuPerfil();
    this.mostrarDropdown = false;
  }

  abrirMenu(): void { this.menuAbierto = true; }
  cerrarMenu(): void { this.menuAbierto = false; }

  abrirMenuPerfil(): void { this.perfilMenuAbierto = true; }
  cerrarMenuPerfil(): void { this.perfilMenuAbierto = false; }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.cerrarMenuPerfil(); 
    this.router.navigate(['/']); 
  }

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
    if (!valor || valor.trim() === '') {
       this.mostrarDropdown = false;
    }
  }

  onBlur(inputElement: HTMLInputElement): void {
    // 250ms de tolerancia para permitir clicks en elementos táctiles
    setTimeout(() => {
      this.cerrarBuscador(inputElement);
    }, 250);
  }

  cerrarBuscador(inputElement?: HTMLInputElement): void {
    this.mostrarDropdown = false;
    this.resultadosBusqueda = [];
    if (inputElement) {
      inputElement.value = ''; 
    }
  }
}