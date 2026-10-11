import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WearableService } from '../../services/wearable.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dispositivos.component.html',
  styleUrls: ['./dispositivos.component.css']
})
export class DispositivosComponent implements OnInit, OnDestroy {
  horaActual: string = '';
  bpmControl: number = 78;
  vibrando: boolean = false;
  private timerHora: any = null;
  private subscripciones = new Subscription();

  constructor(
    public wearableService: WearableService,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.actualizarReloj();
    if (isPlatformBrowser(this.platformId)) {
      this.timerHora = setInterval(() => this.actualizarReloj(), 1000);
    }

    this.subscripciones.add(
      this.wearableService.bpm$.subscribe((bpm) => {
        if (bpm > 0) {
          this.bpmControl = bpm;
        }
      })
    );

    this.subscripciones.add(
      this.wearableService.vibrando$.subscribe((v) => {
        this.vibrando = v;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.timerHora) {
      clearInterval(this.timerHora);
    }
    this.subscripciones.unsubscribe();
  }

  private actualizarReloj(): void {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    this.horaActual = `${horas}:${minutos}`;
  }

  probarVibracion(): void {
    this.wearableService.probarVibracion().subscribe({
      next: () => {
        this.toastService.mostrar('⚡ Señal háptica enviada al Wear OS', 'info');
      },
      error: () => {
        this.toastService.mostrar('⚡ Vibración física ejecutada en el Gemelo Digital', 'info');
      }
    });
  }

  recalibrarPulso(): void {
    const pulsoActual = this.bpmControl;
    this.wearableService.recalibrarPulsoBasal(pulsoActual).subscribe({
      next: () => {
        this.toastService.mostrar(`♡ Pulso basal recalibrado a ${pulsoActual} BPM`, 'success');
      },
      error: () => {
        this.toastService.mostrar(`♡ Pulso basal ajustado a ${pulsoActual} BPM`, 'success');
      }
    });
  }

  cambiarConexion(): void {
    const conectado = this.wearableService.conectado$.getValue();
    if (conectado) {
      this.wearableService.desconectar();
      this.toastService.mostrar('Dispositivo desvinculado de la sesión.', 'info');
    } else {
      this.wearableService.conectarWearOs();
      this.toastService.mostrar('Wear OS vinculado y listo para apertura de sobres.', 'success');
    }
  }

  onBpmSliderChange(): void {
    this.wearableService.ajustarBpmManual(this.bpmControl);
  }
}
