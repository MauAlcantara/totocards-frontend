import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  // URL base de tu API en Render
  private readonly apiUrl = 'https://totocards-backend.onrender.com/api/s3';

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo directamente a AWS S3 usando una Pre-signed URL
   * y guarda sus metadatos en Neon.tech (PostgreSQL)
   */
  subirArchivo(archivo: File, idUsuario?: number): Observable<any> {
    const payload = {
      fileName: archivo.name,
      fileType: archivo.type
    };

    // 1. Solicitar la URL preasignada al backend
    return this.http.post<{ uploadUrl: string; fileKey: string; publicUrl: string }>(
      `${this.apiUrl}/presigned-url`,
      payload
    ).pipe(
      // 2. Subir el binario directo a AWS S3 (sin saturar Render)
      switchMap((resFirmada) => {
        const headers = new HttpHeaders({
          'Content-Type': archivo.type
        });

        // Petición PUT directa al endpoint temporal de Amazon S3
        return this.http.put(resFirmada.uploadUrl, archivo, { headers }).pipe(
          // 3. Confirmar la subida y guardar metadatos en PostgreSQL
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