import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Las descargas de archivos (PDF/XLSX/CSV) se devuelven como
        // StreamableFile y no deben envolverse en { success, data }.
        if (data instanceof StreamableFile) {
          return data;
        }

        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return {
            success: true,
            data: data.items,
            meta: data.meta,
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}

