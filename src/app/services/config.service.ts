import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class ConfigService {
  private config: any;

load() {
    return fetch('/src/assets/config.json')
      .then(r => r.json())
      .then(data => {
        this.config = data;
        console.log("Loaded config:", data);
      });
  }

  get googleClientId() {
    return this.config?.googleClientId;
  }

  // get googleClientId() {
  //   return (window as any).runtimeConfig.googleClientId;
  // }

  get googleClientSecret() {
    return (window as any).runtimeConfig.googleClientSecret;
  }
}