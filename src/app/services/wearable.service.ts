import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Protección para el servidor (SSR)
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WearableService {
  // Emisión de eventos continuos mediante BehaviorSubject (BPM y estado de enlace)[cite: 14]
  public bpm$ = new BehaviorSubject<number>(0);
  public bateria$ = new BehaviorSubject<number>(0);
  public conectado$ = new BehaviorSubject<boolean>(false);

  private dispositivo: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async conectarDispositivo() {
    // Evitamos que Angular intente ejecutar Bluetooth en el servidor de Vercel[cite: 11]
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // 1. Invocación de navigator.bluetooth.requestDevice(...)[cite: 14]
      this.dispositivo = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', 0x180D, 0x180F]
      });

      // 2. Conexión al servidor GATT del smartwatch 
      const server = await this.dispositivo.gatt.connect();
      this.conectado$.next(true);
      console.log('Smartwatch vinculado correctamente:', this.dispositivo.name);

      // 3. Extracción del nivel de batería
      const batteryService = await server.getPrimaryService('battery_service');
      const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
      const batteryValue = await batteryCharacteristic.readValue();
      this.bateria$.next(batteryValue.getUint8(0));
      console.log(`[Batería] Nivel inicial: ${batteryValue.getUint8(0)}%`);

      // 4. Suscripción al sensor de Ritmo Cardíaco (PPG)[cite: 14]
      const hrService = await server.getPrimaryService('heart_rate');
      const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');
      
      await hrCharacteristic.startNotifications();
      hrCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => this.decodificarBPM(event));

      // Escuchar si el reloj se desconecta físicamente
      this.dispositivo.addEventListener('gattserverdisconnected', () => this.desconectar());

    } catch (error) {
      console.error('Error durante la vinculación Bluetooth:', error);
      this.conectado$.next(false);
    }
  }

  // Extracción y decodificación de los paquetes crudos
  private decodificarBPM(event: any) {
    const valorDataView = event.target.value;
    
    // Leer la primera trama de bytes para identificar el formato (8 o 16 bits)
    const banderas = valorDataView.getUint8(0);
    const formato16bits = banderas & 0x01;
    
    let bpm = 0;
    if (formato16bits) {
      bpm = valorDataView.getUint16(1, true); // Little Endian
    } else {
      bpm = valorDataView.getUint8(1);
    }

    // Actualizar el estado y decodificar en consola para evidenciar la práctica[cite: 8]
    this.bpm$.next(bpm);
    console.log(`[Telemetría GATT] Pulso detectado: ${bpm} BPM`);
  }

  desconectar() {
    if (this.dispositivo && this.dispositivo.gatt.connected) {
      this.dispositivo.gatt.disconnect();
    }
    this.conectado$.next(false);
    this.bpm$.next(0);
    console.log('Smartwatch desconectado');
  }
}