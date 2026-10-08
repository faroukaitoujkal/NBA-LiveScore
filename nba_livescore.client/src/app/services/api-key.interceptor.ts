import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add the API Key for requests going to our own API
  const isApiUrl = req.url.startsWith('/api') || req.url.startsWith(environment.apiUrl) || req.url.includes('localhost') || req.url.includes('127.0.0.1');
  
  if (!isApiUrl) {
    return next(req);
  }

  const adminKey = localStorage.getItem('adminApiKey');
  
  if (adminKey) {
    const clonedRequest = req.clone({
      setHeaders: {
        'X-API-Key': adminKey
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};
