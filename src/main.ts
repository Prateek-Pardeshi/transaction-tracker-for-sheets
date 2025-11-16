import 'zone.js';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

fetch('/src/assets/config.json')
.then(response => response.json())
.then(config => {
    (window as any).runtimeConfig = config;
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.error(err));
  });

// platformBrowserDynamic()
//   .bootstrapModule(AppModule)
//   .catch(err => console.error(err));