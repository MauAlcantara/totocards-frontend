import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WearableDispositivo {
  nombre: string;
  modelo: string;
  pantalla: string;
  protocolo: string;
  latenciaLectura: string;
  bateria: number;
  bpm: number;
  pulsoBasal: number;
  modo: string;
  ultimaLectura: string;
}

export interface WearableNotificacion {
  titulo: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class WearableService {

  public bpm$ = new BehaviorSubject<number>(78);
  public bateria$ = new BehaviorSubject<number>(100);
  public conectado$ = new BehaviorSubject<boolean>(true);
  public pulsoBasal$ = new BehaviorSubject<number>(70);
  public vibrando$ = new BehaviorSubject<boolean>(false);
  public notificacionActiva$ = new BehaviorSubject<WearableNotificacion | null>(null);

  public dispositivo$ = new BehaviorSubject<WearableDispositivo>({
    nombre: 'Wear OS XL Round (Emulador)',
    modelo: 'Wear OS · 1.28"',
    pantalla: '240 × 240 px (Circular)',
    protocolo: 'Bridge HTTP / 10.0.2.2 · GATT Emulado',
    latenciaLectura: '150 ms',
    bateria: 100,
    bpm: 78,
    pulsoBasal: 70,
    modo: 'MODO APERTURA',
    ultimaLectura: 'Sincronizado'
  });

  private bpmBase: number = 78;
  private tickOscilacion: number = 0;
  private ultimoUpdateRemoto: number = 0;
  private pollingIntervalId: any = null;
  private oscilacionIntervalId: any = null;
  private dispositivoBluetooth: any = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.iniciarSincronizacionBackend();
      this.iniciarOscilacionFisiologica();
    }
  }

  // Resuelve la URL correcta dinámicamente:
  // - Localhost: apunta al servidor Node.js en localhost:3000
  // - Producción (Vercel): apunta al servidor en Render
  public getApiUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api/wearable';
      }
    }
    return `${environment.apiUrl}/wearable`;
  }

  // Micro-variación fisiológica en el frontend cuando no hay telemetría viva remota activa
  private iniciarOscilacionFisiologica(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.oscilacionIntervalId = setInterval(() => {
      // Si recibimos lecturas vivas del emulador hace menos de 2.5s, no sobreescribir con onda artificial
      const ahora = Date.now();
      const conTelemetriaViva = (ahora - this.ultimoUpdateRemoto) < 2500;

      if (!conTelemetriaViva && this.conectado$.getValue() && this.bpmBase > 0) {
        this.tickOscilacion++;
        const jitter = Math.round(Math.sin(this.tickOscilacion * 0.75) * 1.5);
        const bpmDinamico = Math.max(45, Math.min(220, this.bpmBase + jitter));
        this.bpm$.next(bpmDinamico);

        const actual = this.dispositivo$.getValue();
        this.dispositivo$.next({
          ...actual,
          bpm: bpmDinamico
        });
      }
    }, 1200);
  }

  // Zona de emoción calculada en tiempo real según los umbrales del reporte (Pág. 12)
  // Calma: <75 | Expectativa: 76-95 | Crítica: >95
  public zonaEmocion$ = this.bpm$.pipe(
    map((bpm) => {
      if (bpm === 0) return { nombre: 'DESCONECTADO', clase: 'zona-inactiva', color: '#718096' };
      if (bpm < 75) return { nombre: 'ZONA CALMA', clase: 'zona-calma', color: '#3182ce' };
      if (bpm <= 95) return { nombre: 'ZONA EXPECTATIVA', clase: 'zona-expectativa', color: '#d69e2e' };
      return { nombre: 'ZONA CRÍTICA', clase: 'zona-critica', color: '#e53e3e' };
    })
  );

  // Iniciar sondeo continuo al backend para sincronizar la telemetría del emulador Wear OS
  public iniciarSincronizacionBackend(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }

    // Consulta inicial inmediata
    this.consultarTelemetriaServidor();

    // Sondeo continuo cada 1 segundo (1000 ms) para reflejar cambios del emulador al instante
    this.pollingIntervalId = setInterval(() => {
      this.consultarTelemetriaServidor();
    }, 1000);
  }

  private consultarTelemetriaServidor(): void {
    const url = this.getApiUrl();
    this.http.get<any>(`${url}/telemetria`).subscribe({
      next: (data) => {
        if (data) {
          const estaConectado = Boolean(data.conectado);
          this.conectado$.next(estaConectado);

          if (estaConectado) {
            if (data.bpm !== undefined && data.bpm > 0) {
              this.ultimoUpdateRemoto = Date.now();
              this.bpmBase = data.bpm;
              this.bpm$.next(data.bpm);
            }
          } else {
            this.bpmBase = 0;
            this.bpm$.next(0);
          }

          if (data.bateria !== undefined) {
            this.bateria$.next(data.bateria);
          }
          if (data.pulsoBasal !== undefined) {
            this.pulsoBasal$.next(data.pulsoBasal);
          }

          const actual = this.dispositivo$.getValue();
          this.dispositivo$.next({
            ...actual,
            bpm: estaConectado ? (data.bpm || actual.bpm) : 0,
            bateria: data.bateria !== undefined ? data.bateria : actual.bateria,
            pulsoBasal: data.pulsoBasal !== undefined ? data.pulsoBasal : actual.pulsoBasal,
            modo: estaConectado ? (data.modo || 'MODO APERTURA') : 'DESCONECTADO',
            dispositivo: data.dispositivo || actual.nombre,
            ultimaLectura: estaConectado ? `Sincronizado: ${new Date().toLocaleTimeString()}` : 'Desconectado'
          } as any);
        }
      },
      error: () => {}
    });
  }

  // Ajustar BPM manualmente (útil para pruebas en vivo y demostración de zonas de emoción)
  public ajustarBpmManual(nuevoBpm: number): void {
    const bpmLimpio = Math.max(40, Math.min(200, Math.round(nuevoBpm)));
    this.bpmBase = bpmLimpio;
    this.bpm$.next(bpmLimpio);

    const actual = this.dispositivo$.getValue();
    this.dispositivo$.next({ ...actual, bpm: bpmLimpio });

    // Notificar al backend
    this.http.post(`${this.getApiUrl()}/telemetria`, { bpm: bpmLimpio }).subscribe({
      error: () => {}
    });
  }

  // Disparar prueba de vibración háptica en el reloj (Práctica 1 y 4)
  public probarVibracion(): Observable<any> {
    this.vibrando$.next(true);
    this.notificacionActiva$.next({
      titulo: 'Prueba Háptica',
      mensaje: 'Vibración detonada desde TotoCards Web'
    });

    setTimeout(() => this.vibrando$.next(false), 1200);
    setTimeout(() => this.notificacionActiva$.next(null), 4000);

    return this.http.post(`${this.getApiUrl()}/vibrar`, {});
  }

  public limpiarNotificacion(): void {
    this.notificacionActiva$.next(null);
  }

  // Recalibrar pulso basal (Pág. 11 y 12 del reporte)
  public recalibrarPulsoBasal(valorNuevo?: number): Observable<any> {
    const valor = valorNuevo || this.bpm$.getValue() || 70;
    this.pulsoBasal$.next(valor);

    const actual = this.dispositivo$.getValue();
    this.dispositivo$.next({ ...actual, pulsoBasal: valor });

    return this.http.post(`${this.getApiUrl()}/calibrar`, { pulsoBasal: valor });
  }

  // Enviar notificación al smartwatch (ej. compra confirmada o carta rara)
  public enviarNotificacionWearable(titulo: string, mensaje: string, icono: string = 'alerta'): Observable<any> {
    this.notificacionActiva$.next({ titulo, mensaje });
    setTimeout(() => this.notificacionActiva$.next(null), 4000);

    return this.http.post(`${this.getApiUrl()}/notificacion`, { titulo, mensaje, icono, vibrar: true });
  }

  // Conectar con el emulador de Wear OS
  public conectarWearOs(): void {
    this.conectado$.next(true);
    this.bpmBase = 78;
    this.bpm$.next(78);
    this.bateria$.next(100);

    const actual = this.dispositivo$.getValue();
    this.dispositivo$.next({
      ...actual,
      bpm: 78,
      modo: 'MODO APERTURA',
      ultimaLectura: `Vinculado: ${new Date().toLocaleTimeString()}`
    });

    this.http.post(`${this.getApiUrl()}/estado`, { conectado: true }).subscribe({
      error: () => {}
    });
  }

  // Alias compatible
  public conectarDispositivo(): void {
    this.conectarWearOs();
  }

  // Desconectar dispositivo
  public desconectar(): void {
    if (this.dispositivoBluetooth?.gatt?.connected) {
      this.dispositivoBluetooth.gatt.disconnect();
    }
    this.dispositivoBluetooth = null;

    this.conectado$.next(false);
    this.bpmBase = 0;
    this.bpm$.next(0);

    const actual = this.dispositivo$.getValue();
    this.dispositivo$.next({
      ...actual,
      bpm: 0,
      modo: 'DESCONECTADO',
      ultimaLectura: 'Desconectado'
    });

    this.http.post(`${this.getApiUrl()}/estado`, { conectado: false }).subscribe({
      error: () => {}
    });
  }

  // Método opcional para intentar enlace Web Bluetooth si el usuario lo requiere
  public async conectarDispositivoBluetooth(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!(navigator as any)?.bluetooth) {
      alert('Tu navegador no cuenta con soporte Web Bluetooth. Se mantendrá el enlace activo mediante el Emulador de Wear OS.');
      this.conectarWearOs();
      return;
    }

    try {
      this.dispositivoBluetooth = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', 0x180D, 0x180F]
      });

      const server = await this.dispositivoBluetooth.gatt.connect();
      this.conectado$.next(true);

      const actual = this.dispositivo$.getValue();
      this.dispositivo$.next({
        ...actual,
        nombre: this.dispositivoBluetooth.name || 'Smartwatch BLE',
        protocolo: 'BLE GATT 0x180D / 0x180F Nativo'
      });

      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
        const batteryValue = await batteryCharacteristic.readValue();
        this.bateria$.next(batteryValue.getUint8(0));
      } catch (e) {
        console.warn('No se pudo extraer batería por GATT');
      }

      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');
        await hrCharacteristic.startNotifications();
        hrCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const val = event.target.value;
          const flags = val.getUint8(0);
          const bpm = (flags & 0x01) ? val.getUint16(1, true) : val.getUint8(1);
          this.bpmBase = bpm;
          this.bpm$.next(bpm);
        });
      } catch (e) {
        console.warn('Servicio de ritmo cardíaco no expuesto por el hardware.');
      }

      this.dispositivoBluetooth.addEventListener('gattserverdisconnected', () => this.desconectar());
    } catch (error) {
      console.error('Cancelación o error en enlace Bluetooth:', error);
    }
  }
}