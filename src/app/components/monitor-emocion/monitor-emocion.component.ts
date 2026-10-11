import { Component, OnInit, OnDestroy, HostBinding, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WearableService } from '../../services/wearable.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-monitor-emocion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './monitor-emocion.component.html',
  styleUrls: ['./monitor-emocion.component.css']
})
export class MonitorEmocionComponent implements OnInit, OnDestroy {
  bpmActual: number = 78;
  pulsoBasal: number = 70;
  zonaActual: { nombre: string; clase: string; color: string } = {
    nombre: 'ZONA EXPECTATIVA',
    clase: 'zona-expectativa',
    color: '#d69e2e'
  };

  // Métricas acumuladas de la sesión
  picoMaximo: number = 78;
  promedioBpm: number = 78;
  private lecturasHistoricas: number[] = [];
  
  // Cronómetro de sesión
  segundosTranscurridos: number = 0;
  tiempoFormateado: string = '00:00';

  // Datos para la gráfica de onda continua (ECG / Waveform)
  puntosEcg: string = '';
  private historialOnda: number[] = [];

  // Estado de vibración/tensión en DOM
  esZonaCritica: boolean = false;

  private subscripciones = new Subscription();
  private cronometroTimer: any = null;
  private ondaTimer: any = null;

  constructor(
    public wearableService: WearableService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Inicializar puntos base para el osciloscopio ECG
    for (let i = 0; i < 40; i++) {
      this.historialOnda.push(70);
    }
    this.generarPathEcg();

    if (isPlatformBrowser(this.platformId)) {
      // Iniciar cronómetro de sesión de apertura
      this.iniciarCronometro();

      // Bucle de actualización suave de la onda ECG (cada 150ms)
      this.ondaTimer = setInterval(() => {
        this.avanzarOndaEcg();
      }, 150);
    }

    // Suscripción al ritmo cardíaco
    this.subscripciones.add(
      this.wearableService.bpm$.subscribe((bpm) => {
        if (bpm > 0) {
          this.bpmActual = bpm;
          this.actualizarMetricas(bpm);
          this.esZonaCritica = bpm > 95;
        }
      })
    );

    // Suscripción a la zona cromática de emoción
    this.subscripciones.add(
      this.wearableService.zonaEmocion$.subscribe((zona) => {
        this.zonaActual = zona;
      })
    );

    // Suscripción al pulso basal
    this.subscripciones.add(
      this.wearableService.pulsoBasal$.subscribe((basal) => {
        this.pulsoBasal = basal;
      })
    );

  }

  ngOnDestroy(): void {
    if (this.cronometroTimer) clearInterval(this.cronometroTimer);
    if (this.ondaTimer) clearInterval(this.ondaTimer);
    this.subscripciones.unsubscribe();
  }

  private iniciarCronometro(): void {
    this.cronometroTimer = setInterval(() => {
      this.segundosTranscurridos++;
      const minutos = Math.floor(this.segundosTranscurridos / 60);
      const segs = this.segundosTranscurridos % 60;
      this.tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')} MIN`;
    }, 1000);
  }

  private actualizarMetricas(bpm: number): void {
    this.lecturasHistoricas.push(bpm);
    if (bpm > this.picoMaximo) {
      this.picoMaximo = bpm;
    }

    const suma = this.lecturasHistoricas.reduce((a, b) => a + b, 0);
    this.promedioBpm = Math.round(suma / this.lecturasHistoricas.length);
  }

  // Generador matemático de onda ECG para el canvas/SVG
  private avanzarOndaEcg(): void {
    const bpm = this.bpmActual || 75;
    
    // Generar forma de onda P-Q-R-S-T proporcional al ritmo cardíaco
    const tick = this.segundosTranscurridos * 6 + (this.historialOnda.length % 6);
    let variacion = Math.sin(tick * 0.8) * 3;

    // Generar pico QRS periódico
    if (this.historialOnda.length % 7 === 0) {
      variacion = (bpm / 100) * 28; // Pico R
    } else if (this.historialOnda.length % 7 === 1) {
      variacion = -10; // Onda S
    }

    const nuevoPunto = bpm + variacion;
    this.historialOnda.shift();
    this.historialOnda.push(nuevoPunto);
    this.generarPathEcg();
  }

  private generarPathEcg(): void {
    const width = 500;
    const height = 180;
    const pasoX = width / (this.historialOnda.length - 1);

    // Mapear BPM (40 - 150) a coordenadas Y (height a 0)
    const puntos = this.historialOnda.map((val, idx) => {
      const x = Math.round(idx * pasoX);
      const normalizado = Math.max(0, Math.min(1, (val - 50) / 100));
      const y = Math.round(height - (normalizado * (height - 30) + 15));
      return `${x},${y}`;
    });

    this.puntosEcg = puntos.join(' ');
  }

  // Rotación en grados para la aguja o arco del tacómetro radial (rango 50 a 150 BPM)
  get rotacionAguja(): number {
    const minBpm = 50;
    const maxBpm = 150;
    const clamped = Math.max(minBpm, Math.min(maxBpm, this.bpmActual));
    // Mapear de -120deg a +120deg (arco de 240 grados)
    const ratio = (clamped - minBpm) / (maxBpm - minBpm);
    return -120 + ratio * 240;
  }

  // Simular evento de apertura de sobre con pico de adrenalina
  simularPicoAdrenalina(): void {
    this.wearableService.ajustarBpmManual(114);
  }

  // Restaurar pulso
  restaurarCalma(): void {
    this.wearableService.ajustarBpmManual(72);
  }
}
