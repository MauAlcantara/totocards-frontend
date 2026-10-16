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
      fileType: archivo.type
    };

    return this.http.post<{ uploadUrl: string; fileKey: string; publicUrl: string }>(
      `${this.apiUrl}/presigned-url`,
      payload
    ).pipe(
      switchMap((resFirmada) => {
        const headers = new HttpHeaders({
          'Content-Type': archivo.type
        });

        return this.http.put(resFirmada.uploadUrl, archivo, { headers }).pipe(
          switchMap(() => {
            const metadatos = {
              s3_key: resFirmada.fileKey,
              publicUrl: resFirmada.publicUrl,
              tipo_mime: archivo.type,
              id_usuario: idUsuario || null
            };
            return this.http.post(`${this.apiUrl}/confirmar-subida`, metadatos);
          })
        );
      })
    );
  }
}