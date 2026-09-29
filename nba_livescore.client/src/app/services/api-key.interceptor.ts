import { HttpInterceptorFn } from '@angular/common/http';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  // N'ajoute pas la clé API pour les requêtes vers des API externes (ex: rss2json)
  if (req.url.startsWith('http') && !req.url.includes('localhost') && !req.url.includes('127.0.0.1')) {
    return next(req);
  }

  const clonedRequest = req.clone({
    setHeaders: {
      'X-API-Key': 'ChangeThisToASecureKeyInProduction'
    }
  });
  return next(clonedRequest);
};
