import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { ProductoService } from '../../services/producto.service';

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
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    
    if (anioActual === 2026 && mesActual >= 5 && mesActual <= 7) {
      this.esEventoVerano = true;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.intervalo = setInterval(() => {
        this.imagenActualIndex = (this.imagenActualIndex + 1) % this.imagenesBanner.length;
      }, 4000);
    }
    this.productoService.obtenerProductos().subscribe({
      next: (datos) => {
        const disponibles = datos.filter((p: any) => p.estado !== 'PREVENTA' && p.stock > 0);
        
        disponibles.sort((a: any, b: any) => b.stock - a.stock);
        
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