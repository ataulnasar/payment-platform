import { Injectable } from '@angular/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';

const authConfig: AuthConfig = {
  issuer: 'http://localhost:8080/realms/payment-platform',
  redirectUri: window.location.origin,
  clientId: 'payment-ui',
  responseType: 'code',
  scope: 'openid profile email',
  requireHttps: false, // local dev only
  showDebugInformation: true,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private initialized = false;

  constructor(private oauth: OAuthService) {
    this.init(); // fire and forget
  }

  private async init() {
    try {
      this.oauth.configure(authConfig);
      await this.oauth.loadDiscoveryDocument();
      await this.oauth.tryLoginCodeFlow(); // handles ?code=... callback
      this.initialized = true;

      console.log('OAuth initialized');
      console.log('hasValidAccessToken=', this.isLoggedIn);
    } catch (e) {
      console.error('OAuth init failed', e);
    }
  }

  async login() {
    try {
      if (!this.initialized) {
        // ensure discovery is loaded before redirect
        await this.init();
      }
      console.log('Redirecting to Keycloak...');
      this.oauth.initCodeFlow(); // redirects browser
    } catch (e) {
      console.error('Login failed', e);
    }
  }

  logout() {
    this.oauth.logOut();
  }

  get accessToken(): string {
    return this.oauth.getAccessToken();
  }

  get isLoggedIn(): boolean {
    return this.oauth.hasValidAccessToken();
  }
}
