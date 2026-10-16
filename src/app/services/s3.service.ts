import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private readonly apiUrl = 'https://totocards-backend.onrender.com/api/s3';

  constructor(private http: HttpClient) {}

  subirArchivo(archivo: File, idUsuario?: number): Observable<any> {
    const payload = {
      fileName: archivo.name,
      fileType: archivo.type || 'image/jpeg'
    };

    // 1. Pedir la URL preasignada al backend (aquí el interceptor sí puede mandar el Bearer token)
    return this.http.post<{ uploadUrl: string; fileKey: string; publicUrl: string }>(
      `${this.apiUrl}/presigned-url`,
      payload
    ).pipe(
      // 2. Subir directamente a AWS S3 usando 'fetch' nativo para omitir interceptores de Angular
      switchMap((resFirmada) => {
        const subidaPromise = fetch(resFirmada.uploadUrl, {
          method: 'PUT',
          body: archivo,
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Error en S3 con status ${response.status}`);
          }
          return response;
        });

        // Convertimos la promesa de fetch en Observable
        return from(subidaPromise).pipe(
          // 3. Confirmar registro en PostgreSQL (Neon.tech)
          switchMap(() => {
            const metadatos = {
              s3_key: resFirmada.fileKey,
              publicUrl: resFirmada.publicUrl,
              tipo_mime: archivo.type || 'image/jpeg',
              id_usuario: idUsuario || null
            };
            return this.http.post(`${this.apiUrl}/confirmar-subida`, metadatos);
          })
        );
      })
    );
  }
}