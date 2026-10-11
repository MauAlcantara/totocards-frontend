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

@Injectable({
  providedIn: 'root'
})
export class WearableService {
  private apiUrl = `${environment.apiUrl}/wearable`;

  public bpm$ = new BehaviorSubject<number>(78);
  public bateria$ = new BehaviorSubject<number>(100);
  public conectado$ = new BehaviorSubject<boolean>(true);
  public pulsoBasal$ = new BehaviorSubject<number>(70);
  public vibrando$ = new BehaviorSubject<boolean>(false);

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
    ultimaLectura: 'Última lectura hace 0.2s'
  });

  private pollingIntervalId: any = null;
  private simularIntervalId: any = null;
  private dispositivoBluetooth: any = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.iniciarSincronizacionBackend();
    }
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

  // Iniciar sondeo periódico al backend para sincronizar la telemetría del emulador Wear OS
  public iniciarSincronizacionBackend(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }

    // Consulta inicial inmediata
    this.consultarTelemetriaServidor();

    // Sondeo ligero cada 2.5 segundos
    this.pollingIntervalId = setInterval(() => {
      if (this.conectado$.getValue()) {
        this.consultarTelemetriaServidor();
      }
    }, 2500);
  }

  private consultarTelemetriaServidor(): void {
    this.http.get<any>(`${this.apiUrl}/telemetria`).subscribe({
      next: (data) => {
        if (data) {
          if (data.bpm !== undefined && data.bpm > 0) {
            this.bpm$.next(data.bpm);
          }
          if (data.bateria !== undefined) {
            this.bateria$.next(data.bateria);
          }
          if (data.pulsoBasal !== undefined) {
            this.pulsoBasal$.next(data.pulsoBasal);
          }
          if (data.conectado !== undefined) {
            this.conectado$.next(data.conectado);
          }

          const actual = this.dispositivo$.getValue();
          this.dispositivo$.next({
            ...actual,
            bpm: data.bpm || actual.bpm,
            bateria: data.bateria || actual.bateria,
            pulsoBasal: data.pulsoBasal || actual.pulsoBasal,
            modo: data.modo || actual.modo,
            dispositivo: data.dispositivo || actual.nombre,
            ultimaLectura: `Última sincronización: ${new Date().toLocaleTimeString()}`
          } as any);
        }
      },
      error: () => {
        // En caso de que el backend local no esté activo, el servicio mantiene los valores en memoria reactiva
      }
    });
  }

  // Ajustar BPM manualmente (útil para pruebas en vivo y demostración de zonas de emoción)
  public ajustarBpmManual(nuevoBpm: number): void {
    const bpmLimpio = Math.max(40, Math.min(200, Math.round(nuevoBpm)));
    this.bpm$.next(bpmLimpio);

    const actual = this.dispositivo$.getValue();
    this.dispositivo$.next({ ...actual, bpm: bpmLimpio });

    // Notificar al backend
    this.http.post(`${this.apiUrl}/telemetria`, { bpm: bpmLimpio }).subscribe({
      error: () => {}
    });
  }

  // Disparar prueba de vibración háptica en el reloj (Práctica 1 y 4)
  public probarVibracion(): Observable<any> {
    this.vibrando$.next(true);
    setTimeout(() => this.vibrando$.next(false), 1200);

    return this.http.post(`${this.apiUrl}/vibrar`, {});
  }

  // Recalibrar pulso basal (Pág. 11 y 12 del reporte)
  public recalibrarPulsoBasal(valorNuevo?: number): Observable<any> {
    const valor = valorNuevo || this.bpm$.getValue() || 70;
    this.pulsoBasal$.next(valor);

    const actual = this.dispositivo$.getValue();
    this.dispositivo$.next({ ...actual, pulsoBasal: valor });

    return this.http.post(`${this.apiUrl}/calibrar`, { pulsoBasal: valor });
  }

  // Enviar notificación al smartwatch (ej. compra confirmada o carta rara)
  public enviarNotificacionWearable(titulo: string, mensaje: string, icono: string = 'alerta'): Observable<any> {
    return this.http.post(`${this.apiUrl}/notificacion`, { titulo, mensaje, icono, vibrar: true });
  }

  // Conectar con el emulador de Wear OS
  public conectarWearOs(): void {
    this.conectado$.next(true);
    if (this.bpm$.getValue() === 0) {
      this.bpm$.next(78);
    }
    this.bateria$.next(100);

    this.http.post(`${this.apiUrl}/estado`, { conectado: true }).subscribe({
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
    this.bpm$.next(0);

    this.http.post(`${this.apiUrl}/estado`, { conectado: false }).subscribe({
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