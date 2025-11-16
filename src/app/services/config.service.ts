import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class ConfigService {
  get googleClientId() {
    return (window as any).runtimeConfig.googleClientId;
  }

  get googleClientSecret() {
    return (window as any).runtimeConfig.googleClientSecret;
  }
}