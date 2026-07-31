import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { ProductoService } from '../../services/producto.service'; // 🔥 Importamos el servicio

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  imagenesBanner: string[] = [
    'assets/banner-Fondo.jpg  ',
    'assets/banner-Fondo2.jpg',
    'assets/banner-Fondo3.jpg'
  ];
  imagenActualIndex: number = 0;
  intervalo: any;
  esEventoVerano: boolean = false;
  productosDestacados: any[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private productoService: ProductoService) {}

  ngOnInit() {
    // 1. Evaluación Calendarizada (Práctica de Periodo)
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    
    if (anioActual === 2026 && mesActual >= 5 && mesActual <= 7) {
      this.esEventoVerano = true;
    }

    // 2. Carrusel Crossfade
    if (isPlatformBrowser(this.platformId)) {
      this.intervalo = setInterval(() => {
        this.imagenActualIndex = (this.imagenActualIndex + 1) % this.imagenesBanner.length;
      }, 4000);
    }
    // 🔥 3. Carga Dinámica de Productos Destacados
    this.productoService.obtenerProductos().subscribe({
      next: (datos) => {
        // Filtramos para evitar preventas o agotados
        const disponibles = datos.filter((p: any) => p.estado !== 'PREVENTA' && p.stock > 0);
        
        // Ordenamos por stock de mayor a menor
        disponibles.sort((a: any, b: any) => b.stock - a.stock);
        
        // Tomamos solo los 3 productos con más stock para la página principal
        this.productosDestacados = disponibles.slice(0, 3);
      },
      error: (err) => console.error('Error cargando los destacados', err)
    });
  }

  ngOnDestroy() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }
}