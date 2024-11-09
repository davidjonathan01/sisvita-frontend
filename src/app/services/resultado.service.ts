import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resultado } from '../model/resultado';
import { getConexionBackend } from '../constants';
import { Test } from '../model/test';

@Injectable({
  providedIn: 'root'
})
export class ResultadoService {
  readonly BASE_URL: string | undefined;

  constructor(private http: HttpClient) {
    this.BASE_URL = getConexionBackend();
    this.BASE_URL = `${this.BASE_URL}/cus_evaluar_resultados_test/`;
    console.log(this.BASE_URL);
   }

   getResultadosEspecialista(id_especialista: number): Observable<any> {
    return this.http.get<string[]>(`${this.BASE_URL}resultados_especialista/${id_especialista}`);
  }
  updateResultado(id_resultado: number, data: Partial<Resultado>): Observable<any> {
    return this.http.put<any>(`${this.BASE_URL}update_resultado/${id_resultado}`, data);
  }
  getTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.BASE_URL}get_tests`);
  }
  invitarRealizarTest(id_resultado: number, id_test: number, id_especialista: number): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}invitar_test`, { id_resultado, id_test ,id_especialista});
  }
}
