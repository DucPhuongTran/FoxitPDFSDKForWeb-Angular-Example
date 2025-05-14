import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class APIServiceService {

  public http: HttpClient;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(http: HttpClient, public router: Router) {
    this.http = http;
  }

  getFile(url: string): Observable<any> {
    return this.http
      .get(
        `${url}`, { ...this.httpOptions, responseType: 'blob' as 'json' },
      );
  }
}
