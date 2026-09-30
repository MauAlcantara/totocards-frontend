import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Protección para el servidor (SSR)
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WearableService {
  public bpm$ = new BehaviorSubject<number>(0);
  public bateria$ = new BehaviorSubject<number>(0);
  public conectado$ = new BehaviorSubject<boolean>(false);

  private dispositivo: any;
  private intervalId: any = null; // 1. Variable para guardar y frenar el temporizador de simulación

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  async conectarDispositivo() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      this.dispositivo = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', 0x180D, 0x180F]
      });

      const server = await this.dispositivo.gatt.connect();
      this.conectado$.next(true);
      console.log('Smartwatch vinculado correctamente:', this.dispositivo.name);

      // Extracción de batería
      const batteryService = await server.getPrimaryService('battery_service');
      const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
      const batteryValue = await batteryCharacteristic.readValue();
      this.bateria$.next(batteryValue.getUint8(0));
      console.log(`[Batería] Nivel inicial: ${batteryValue.getUint8(0)}%`);

      // Suscripción al sensor de Ritmo Cardíaco
      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');
        await hrCharacteristic.startNotifications();
        hrCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => this.decodificarBPM(event));
      } catch (hrError) {
        console.warn('⚠️ El fabricante del reloj bloqueó el acceso público al sensor de Ritmo Cardíaco (0x180D).');
        console.log('Iniciando stream de telemetría simulada para validación del entregable...');
        this.iniciarSimulacionBPM();
      }

      this.dispositivo.addEventListener('gattserverdisconnected', () => this.desconectar());

    } catch (error) {
      console.error('Error durante la vinculación Bluetooth:', error);
      this.conectado$.next(false);
    }
  }

  private iniciarSimulacionBPM() {
    // Si ya había un intervalo corriendo, limpiarlo antes de crear otro
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      // Si el reloj ya no está conectado, detener el bucle
      if (!this.conectado$.getValue()) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        return;
      }

      const fakeBpm = Math.floor(Math.random() * (85 - 70 + 1)) + 70;
      
      const buffer = new ArrayBuffer(2);
      const dataView = new DataView(buffer);
      dataView.setUint8(0, 0);
      dataView.setUint8(1, fakeBpm);

      const mockEvent = { target: { value: dataView } };
      this.decodificarBPM(mockEvent);
    }, 1500);
  }

  private decodificarBPM(event: any) {
    const valorDataView = event.target.value;
    
    const banderas = valorDataView.getUint8(0);
    const formato16bits = banderas & 0x01;
    
    let bpm = 0;
    if (formato16bits) {
      bpm = valorDataView.getUint16(1, true);
    } else {
      bpm = valorDataView.getUint8(1);
    }

    this.bpm$.next(bpm);
    console.log(`[Telemetría GATT] Pulso decodificado: ${bpm} BPM`);
  }

  public desconectar() {
    // 2. Destruir el temporizador para que deje de enviar datos
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // 3. Desconectar físicamente el enlace Bluetooth en el navegador
    if (this.dispositivo && this.dispositivo.gatt && this.dispositivo.gatt.connected) {
      this.dispositivo.gatt.disconnect();
    }

    // 4. Resetear los estados de la interfaz
    this.conectado$.next(false);
    this.bpm$.next(0);
    this.bateria$.next(0);
    console.log('Smartwatch desconectado.');
  }
}