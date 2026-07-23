import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
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
  
  // Variable para el evento calendarizado
  esEventoVerano: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // 1. Evaluación Calendarizada (Práctica de Periodo)
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth(); // Enero es 0, Junio es 5, Agosto es 7
    const anioActual = fechaActual.getFullYear();
    
    // Si estamos entre junio y agosto del 2026, activamos el evento
    if (anioActual === 2026 && mesActual >= 5 && mesActual <= 7) {
      this.esEventoVerano = true;
    }

    // 2. Carrusel Crossfade
    if (isPlatformBrowser(this.platformId)) {
      this.intervalo = setInterval(() => {
        this.imagenActualIndex = (this.imagenActualIndex + 1) % this.imagenesBanner.length;
      }, 4000);
    }
  }

  ngOnDestroy() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }
}