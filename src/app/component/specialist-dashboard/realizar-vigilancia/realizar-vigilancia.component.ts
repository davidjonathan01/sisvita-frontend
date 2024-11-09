import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { Escala } from '../../../model/escala';
import { Invitacion } from '../../../model/invitacion';
import { Resultado } from '../../../model/resultado';
import { Test } from '../../../model/test';
import { Tipo_Test } from '../../../model/tipo-test';
import { AuthService } from '../../../services/auth.service';
import { RealizarVigilanciaService } from '../../../services/realizar-vigilancia.service';
import { GoogleMap, MapHeatmapLayer, GoogleMapsModule } from '@angular/google-maps';


@Component({
  selector: 'app-realizar-vigilancia',
  standalone: true,
  imports: [CommonModule, FormsModule, MatGridListModule,MatIconModule, GoogleMap, MapHeatmapLayer, GoogleMapsModule],
  templateUrl: './realizar-vigilancia.component.html',
  styleUrls: ['./realizar-vigilancia.component.css']
})
export class RealizarVigilanciaComponent implements OnInit {
  tests: Test[] = [];
  resultados: Resultado[] = [];
  invitaciones: Invitacion[] = [];
  invitacion: Invitacion | null = null;
  escalas: { [key: number]: Escala[] } = {}; // Cambiamos escalas a un diccionario para evitar duplicación
  inviteTestId: number | null = null;
  id_especialista: number | null = null; // Inicialmente null, será asignado dinámicamente
  selectedTestId: number | null = null; // Variable para almacenar el ID del test seleccionado para invitar
  
  //Variables para la ventana modal
  mostrarModal: boolean = false;
  modalTitle: string = '';
  modalData: any = null;
  modalType: string = '';
  notificacionSeleccionada: any = { correo: false, whatsapp: false };

  //Variables para ordenar columnas
  originalResultados: Resultado[] = [];
  sortDirection: { [key: string]: string } = {};
  sortAscending: boolean = true; // Estado de la ordenación (ascendente por defecto)
  sortAscendingPaciente: boolean = true; // Estado de la ordenación (ascendente por defecto) para pacientes
  sortAscendingTest: boolean = true; // Estado de la ordenación (ascendente por defecto) para test
  lastSorted: string = ''; // Rastrea la última columna ordenada
  sortAscendingEscala: boolean = true; // Estado de la ordenación (ascendente por defecto) para escala
  mostrarModalNotificacion: boolean = false;

  //Variables para Filtros
  tipoTestSeleccionado: number | null = null; // Almacenar el tipo de test seleccionado
  testsDisponiblesFilter: Test[] = []; // Almacenar todos los tests
  tiposTest: Tipo_Test[] = []; // Almacenar los tipos de tests
  estadoSeleccionado: number | null = null;
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  // Variables para el mapa de calor
  mostrarMapaCalor: boolean = false;
  center = { lat: -12.0464, lng: -77.0428 }; // Centro de Lima
  zoom = 10;
  heatmapOptions = {
    radius: 60,
    opacity: 0.6
  };
  heatmapData: { lat: number, lng: number }[] = [];


  constructor(private realizarVigilanciaService: RealizarVigilanciaService, private authService: AuthService) {}

  ngOnInit() {
    this.id_especialista = this.authService.getEspecialistaId();
    if (this.id_especialista !== null) {
      this.cargarResultados();
      this.loadTests();
      this.loadTipoTests(); // Cargar los tipos de tests
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error ...',
        text: 'No se pudo obtener el ID del especialista!',
      });
    }
  }
  /*generateHeatmapData() {
    const points = [
      { lat: -12.0464, lng: -77.0428 }, // Lima
      { lat: -12.086, lng: -77.0012 }, // San Martín de Porres
      { lat: -12.0153, lng: -77.0703 }, // San Miguel
      { lat: -12.0433, lng: -77.0301 }, // Pueblo Libre
      { lat: -12.0621, lng: -77.0369 }, // Breña
      { lat: -12.0851, lng: -76.9908 }, // Los Olivos
      { lat: -12.0721, lng: -77.0806 }, // Magdalena del Mar
      { lat: -12.0908, lng: -77.0469 }, // Jesús María
      { lat: -12.0773, lng: -77.0833 }, // San Isidro
      { lat: -12.1211, lng: -77.0293 }, // Miraflores
      { lat: -12.1393, lng: -77.0075 }, // Barranco
      { lat: -12.1196, lng: -77.0343 }, // Surco (Santiago de Surco)
      { lat: -12.0937, lng: -77.0011 }, // San Borja
      { lat: -12.0566, lng: -77.0326 }, // Lince
      { lat: -12.0965, lng: -76.962 }, // Ate
      { lat: -12.1543, lng: -76.9758 }, // La Molina
      { lat: -12.0704, lng: -77.1334 }, // Callao
      { lat: -12.1078, lng: -77.0418 }, // La Victoria
      { lat: -12.0931, lng: -77.0421 }, // Rímac
      { lat: -12.0459, lng: -77.0312 }, // Cercado de Lima
      { lat: -12.146, lng: -77.0194 }, // Chorrillos
      { lat: -12.153, lng: -76.9639 }, // Cieneguilla
      { lat: -12.215, lng: -76.9263 }, // Pachacámac
      { lat: -12.0934, lng: -77.0529 }, // San Juan de Lurigancho
      { lat: -12.1631, lng: -76.9755 }, // Villa El Salvador
      { lat: -12.1292, lng: -77.015 } // Villa María del Triunfo
    ];
    return points;
  }
  // Mostrar/Ocultar el mapa de calor
  toggleMapaCalor() {
    this.mostrarMapaCalor = !this.mostrarMapaCalor;
  }*/
    generateHeatmapData() {
      const uniqueCoordinates = new Set();
      this.heatmapData = this.resultados
        .map(resultado => ({
          lat: parseFloat(resultado.evaluacion.paciente.ubigeo.latitud),
          lng: parseFloat(resultado.evaluacion.paciente.ubigeo.longitud),
        }))
        .filter(coord => {
          const key = `${coord.lat}-${coord.lng}`;
          if (uniqueCoordinates.has(key)) {
            return false;
          } else {
            uniqueCoordinates.add(key);
            return true;
          }
        })
    }

  // Mostrar/Ocultar el mapa de calor
  toggleMapaCalor() {
    this.generateHeatmapData();
    console.log(this.heatmapData);
    this.mostrarMapaCalor = !this.mostrarMapaCalor;
  }


  cargarResultados() {
    if (this.id_especialista !== null) {
      this.realizarVigilanciaService.getResultadosEspecialista(this.id_especialista).subscribe(
        (result: any) => {
          this.resultados = result.data;
          this.originalResultados = [...this.resultados]; // Guardar el estado original de los resultados
          
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
    this.realizarVigilanciaService.getTests().subscribe(
      (result: any) => {
        this.tests = result.data;
      },
      (err: any) => {
        console.error('Error al cargar tests', err);
      }
    );
  }

  loadTipoTests() {
    this.realizarVigilanciaService.getTipoTests().subscribe(
      (result: any) => {
        this.tiposTest = result.data;
      },
      (err: any) => {
        console.error('Error al cargar tipos de tests', err);
      }
    );
  }

  showTestsDisponiblesFilter() {
    if (this.tipoTestSeleccionado !== null) {
      this.testsDisponiblesFilter = this.tests.filter(test => test.id_tipo_test === this.tipoTestSeleccionado);
      console.log(this.testsDisponiblesFilter)
    } else {
      this.tests = [];
    }
  }
  

  filtrarResultados() {
    let resultadosFiltrados = this.originalResultados;
  
    if (this.tipoTestSeleccionado !== null) {
      resultadosFiltrados = resultadosFiltrados.filter(resultado => resultado.evaluacion.test.id_tipo_test === this.tipoTestSeleccionado);
    }
  
    if (this.selectedTestId !== null) {
      resultadosFiltrados = resultadosFiltrados.filter(resultado => resultado.evaluacion.test.id_test === this.selectedTestId);
    }
  
    if (this.estadoSeleccionado !== null) {
      resultadosFiltrados = resultadosFiltrados.filter(resultado => resultado.estado.id_estado === this.estadoSeleccionado);
    }

    if (this.fechaInicio !== null && this.fechaFin !== null) {
      const fechaInicioSinHora = new Date(this.fechaInicio);
      fechaInicioSinHora.setHours(0, 0, 0, 0);
      const fechaFinSinHora = new Date(this.fechaFin);
      fechaFinSinHora.setHours(23, 59, 59, 999);
  
      /*resultadosFiltrados = resultadosFiltrados.filter(resultado => {
        const fecha = resultado.estado.id_estado === 5 ? new Date(resultado.fec_interpretacion) : new Date(resultado.evaluacion.fec_realizacion);
        const fechaSinHora = new Date(fecha);
        fechaSinHora.setHours(0, 0, 0, 0);
        return fechaSinHora >= fechaInicioSinHora && fechaSinHora <= fechaFinSinHora;
      });*/
      console.log(fechaInicioSinHora);
      console.log(fechaFinSinHora)
      console.log(resultadosFiltrados);
    }
  
    this.resultados = resultadosFiltrados;
  }
  
  filtrarResultadosPorTipoTest() {
    this.showTestsDisponiblesFilter();
    this.filtrarResultados();
  }
  
  onTestSeleccionadoChange() {
    this.filtrarResultados();
  }
  
  filtrarResultadosPorEstado() {
    this.filtrarResultados();
  }
  
  onFechaChange() {
    this.filtrarResultados();
  }

  

  invitarTest(resultado: Resultado, inviteTestId: number | null) {
    if (this.inviteTestId !== null && this.id_especialista !== null) {
      const invitacion: any = {
        id_especialista: resultado.id_especialista,
        id_resultado: resultado.id_resultado,
        id_test: inviteTestId,
      };

      this.realizarVigilanciaService.invitarRealizarTest(invitacion).subscribe(
        (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Invitación enviada',
            text: 'El paciente ha sido invitado a realizar el test seleccionado!',
          });
          this.cerrarModal();
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
    console.log("Resultado no revisado", resultado)
    this.realizarVigilanciaService.updateResultado(resultado.id_resultado, {
      id_escala: resultado.escala.id_escala,      
      observacion: resultado.observacion,
      informe: resultado.informe,
      recomendacion: resultado.recomendacion
    }).subscribe(
      (response: any) => {
        console.log("Resultado no revisado", response.data)
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Interpretación guardada exitosamente!',
        });
        this.cerrarModal();
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

  mostrarDetalles(resultado: any, tipo: string) {
    this.modalTitle = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    this.modalData = resultado;
    this.modalType = tipo;
    this.mostrarModal = true;

    if (tipo === 'invitaciones') {
      this.loadTests();
      //this.cargarInvitaciones(resultado.id_resultado);
    } else if (tipo === 'revisar') {
      this.cargarEscalas(resultado.evaluacion.test.id_test);
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modalData = null;
    this.modalType = '';
  }

  cargarEscalas(id_test: number) {
    if (!this.escalas[id_test]) {
      this.realizarVigilanciaService.getEscalasByTest(id_test).subscribe(
        (result: any) => {
          this.escalas[id_test] = result.data;
        },
        (err: any) => {
          console.error('Error al cargar escalas', err);
          Swal.fire({
            icon: 'error',
            title: 'Error ...',
            text: 'Error al cargar escalas!',
          });
        }
      );
    }
  }

  isRevisarFormValid(): boolean {
    return this.modalData?.observacion && this.modalData?.informe && this.modalData?.recomendacion;
  }

  // Método para mostrar la ventana modal de notificación
  abrirModalNotificacion() {
    this.mostrarModalNotificacion = true; // Mostrar la ventana modal de notificación
  }

  // Método para cerrar la ventana modal de notificación
  cerrarModalNotificacion() {
    this.mostrarModalNotificacion = false;
  }
  
  guardarNotificacion() {
    const resultado = this.modalData; // Obtener el resultado seleccionado
    const mensaje = `
      Nivel de Ansiedad: ${resultado.escala.nombre}
      Observación: ${resultado.observacion}
      Informe: ${resultado.informe}
      Recomendaciones: ${resultado.recomendacion}
      Fecha: ${resultado.estado.id_estado === 5 ? new Date(resultado.fec_interpretacion).toLocaleDateString() : new Date(resultado.evaluacion.fec_realizacion).toLocaleDateString()}
      Score: ${resultado.evaluacion.puntaje}
      Test: ${resultado.evaluacion.test.nombre}
    `;
    
    console.log('Correo destinatario',resultado.evaluacion.paciente.usuario.email)
    console.log('Mensaje',mensaje)
    
    if (this.notificacionSeleccionada.correo) {
      this.realizarVigilanciaService.enviarCorreo(resultado.evaluacion.paciente.usuario.email, mensaje).subscribe(
        response => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Correo enviado exitosamente!',
          });
          this.cerrarModalNotificacion();
        },
        error => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al enviar el correo.',
          });
        }
      );
    }
  
    if (this.notificacionSeleccionada.whatsapp) {
      // Lógica para enviar el mensaje de WhatsApp
      this.enviarWhatsapp(resultado.evaluacion.paciente.persona.num_telefono, mensaje);
    }
  
    this.cerrarModalNotificacion();
  }


  enviarWhatsapp(numero: string, mensaje: string) {
    // Lógica para enviar el mensaje de WhatsApp
    console.log('Enviar WhatsApp a:', numero);
    console.log('Mensaje:', mensaje);
    // Aquí puedes implementar la llamada al servicio que envía el mensaje de WhatsApp
  }

  isNotificacionFormValid(): boolean {
    return this.notificacionSeleccionada.correo || this.notificacionSeleccionada.whatsapp;
  }

  getColorForScale(testId: number, scaleName: string): string {
    if (!this.escalas[testId]) {
      this.cargarEscalas(testId);
      return 'transparent'; // Espera a que las escalas se carguen
    }

    const scales = this.escalas[testId];
    const totalScales = scales.length;

    if (totalScales === 0) return 'transparent'; // No se encontraron escalas

    // Determina los rangos de color dinámicamente
    const colors = this.generateColorGradient(totalScales);

    for (let i = 0; i < totalScales; i++) {
      const scale = scales[i];
      if (scale.nombre === scaleName) {
        return colors[i];
      }
    }

    return 'transparent'; // Color predeterminado si no se encuentra coincidencia
  }

  // Método para generar un gradiente de color basado en la cantidad de escalas
  generateColorGradient(totalScales: number): string[] {
    const startColor = [56, 208, 8]; // Verde
    const midColor = [255, 191, 0];  // Amarillo
    const endColor = [241, 0, 0];    // Rojo
    const colors = [];

    const midPoint = Math.floor(totalScales / 2);

    for (let i = 0; i < totalScales; i++) {
      let r, g, b;
      if (i <= midPoint) {
        const ratio = i / midPoint;
        r = Math.round(startColor[0] + ratio * (midColor[0] - startColor[0]));
        g = Math.round(startColor[1] + ratio * (midColor[1] - startColor[1]));
        b = Math.round(startColor[2] + ratio * (midColor[2] - startColor[2]));
      } else {
        const ratio = (i - midPoint) / (totalScales - midPoint - 1);
        r = Math.round(midColor[0] + ratio * (endColor[0] - midColor[0]));
        g = Math.round(midColor[1] + ratio * (endColor[1] - midColor[1]));
        b = Math.round(midColor[2] + ratio * (endColor[2] - midColor[2]));
      }
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    return colors;
  }
  sortByPaciente() {
    if (this.sortAscendingPaciente) {
      this.resultados.sort((a, b) => this.compareByPaciente(a, b));
    } else {
      this.resultados.sort((a, b) => this.compareByPaciente(b, a));
    }
    this.sortAscendingPaciente = !this.sortAscendingPaciente;
  }
  
  sortByTest() {
    if (this.sortAscendingTest) {
      this.resultados.sort((a, b) => this.compareByTest(a, b));
    } else {
      this.resultados.sort((a, b) => this.compareByTest(b, a));
    }
    this.sortAscendingTest = !this.sortAscendingTest;
  }

  sortByEscala() {
    if (this.sortAscendingEscala) {
      this.resultados.sort((a, b) => this.compareByEscala(a, b));
    } else {
      this.resultados.sort((a, b) => this.compareByEscala(b, a));
    }
    this.sortAscendingEscala = !this.sortAscendingEscala;
  }
  
  compareByPaciente(a: Resultado, b: Resultado): number {
    const nameA = `${a.evaluacion.paciente.persona.nombres} ${a.evaluacion.paciente.persona.apellidos}`.toLowerCase();
    const nameB = `${b.evaluacion.paciente.persona.nombres} ${b.evaluacion.paciente.persona.apellidos}`.toLowerCase();
    return nameA.localeCompare(nameB);
  }
  
  compareByTest(a: Resultado, b: Resultado): number {
    return a.evaluacion.test.id_test - b.evaluacion.test.id_test;
  }

  compareByEscala(a: Resultado, b: Resultado): number {
    return a.escala.id_escala - b.escala.id_escala;
  }


}
