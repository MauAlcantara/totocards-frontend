import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

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

    return this.http.post<{ uploadUrl: string; fileKey: string; publicUrl: string }>(
      `${this.apiUrl}/presigned-url`,
      payload
    ).pipe(
      switchMap((resFirmada) => {
        // Asignamos el Content-Type del archivo
        const headers = new HttpHeaders({
          'Content-Type': archivo.type || 'image/jpeg'
        });

        // Petición PUT directa al endpoint temporal de Amazon S3
        return this.http.put(resFirmada.uploadUrl, archivo, { headers }).pipe(
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