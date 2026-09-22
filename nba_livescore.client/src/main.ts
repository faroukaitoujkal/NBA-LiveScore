import { inject } from '@vercel/analytics';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/components/app/app.component';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

inject();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
}).catch(err => console.error(err));
