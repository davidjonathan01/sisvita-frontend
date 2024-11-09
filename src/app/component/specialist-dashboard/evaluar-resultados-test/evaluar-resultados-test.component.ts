import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // Importa FormsModule
import { ResultadoService } from '../../../services/resultado.service';
import { Resultado } from '../../../model/resultado';
import { Test } from '../../../model/test';
import Swal from 'sweetalert2';
import { Invitacion } from '../../../model/invitacion';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-evaluar-resultados-test',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './evaluar-resultados-test.component.html',
  styleUrl: './evaluar-resultados-test.component.css'
})
export class EvaluarResultadosTestComponent implements OnInit{
  tests: Test[]=[]
  resultados: Resultado[] = [];
  invitaciones: Invitacion[]=[];
  id_especialista: number | null = null; // Inicialmente null, será asignado dinámicamente
  selectedTestId: number | null = null; // Variable para almacenar el ID del test seleccionado para invitar

  constructor(private resultadoService: ResultadoService,private authService: AuthService) {}

  ngOnInit() {
    this.id_especialista = this.authService.getEspecialistaId();
    if (this.id_especialista !== null) {
      this.cargarResultados();
      this.loadTests();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error ...',
        text: 'No se pudo obtener el ID del especialista!',
      });
    }

  }

  cargarResultados() {
    if (this.id_especialista !== null) {
      this.resultadoService.getResultadosEspecialista(this.id_especialista).subscribe(
        (result: any) => {
          this.resultados = result.data;
        },
        (err: any) => {
          console.error('Error al cargar resultados', err);
          Swal.fire({
            icon: 'error',
            title: 'Error ...',
            text: 'Error al cargar resultados!',
          });
        }
      );
    }
  }

  loadTests() {
    this.resultadoService.getTests().subscribe(
      (result: any) => {
        this.tests = result.data;
      },
      (err: any) => {
        console.error('Error al cargar tests', err);
      }
    );
  }
  onObservacionChange(resultado: Resultado) {
    // Esta función se llama cada vez que la observación cambia
  }

  
  invitarTest(id_resultado: number, id_test: number | null) {
    if (id_test !== null  && this.id_especialista !== null) {
      this.resultadoService.invitarRealizarTest(id_resultado, id_test,this.id_especialista).subscribe(
        (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Invitación enviada',
            text: 'El paciente ha sido invitado a realizar el test seleccionado!',
          });
        },
        (err: any) => {
          console.error('Error al invitar al paciente', err);
          Swal.fire({
            icon: 'error',
            title: 'Error ...',
            text: 'Error al invitar al paciente!',
          });
        }
      );
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione un test',
        text: 'Debe seleccionar un test antes de enviar la invitación!',
      });
    }
  }


  culminarResultado(resultado: Resultado) {
    this.resultadoService.updateResultado(resultado.id_resultado, { observacion: resultado.observacion }).subscribe(
      (response: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Interpretación guardada exitosamente!',
        });
      },
      (err: any) => {
        console.error('Error al guardar interpretación', err);
        Swal.fire({
          icon: 'error',
          title: 'Error ...',
          text: 'Error al guardar interpretación!',
        });
      }
    );
  }
}