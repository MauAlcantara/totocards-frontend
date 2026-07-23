import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  texto: string;
  tipo: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage | null>();
  toastState$ = this.toastSubject.asObservable();

  mostrar(texto: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.toastSubject.next({ texto, tipo });
    
    // La notificación desaparecerá sola después de 3.5 segundos
    setTimeout(() => {
      this.ocultar();
    }, 3500);
  }

  ocultar(): void {
    this.toastSubject.next(null);
  }
}