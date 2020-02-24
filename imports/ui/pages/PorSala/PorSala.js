import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Reservas } from '/imports/api/collections/collections.js';
import { Calendario } from '/imports/api/collections/collections.js';

import './PorSala.html';
import './EditaModulo.js';
import '../../partials/SelectorDeSala.js';

Template.PorSala.onCreated(function(){
  this.autorun( () => {
    let semana = Session.get('semana');

    //Se suscribe a las reservas de la sala activa y la semana activa, de lunes a domingo
    Subs.subscribe('reservasSuperpuestas');
    let handle = Subs.subscribe('reservasSala', Session.get('sala'), semana[0], semana[6]);
    Session.set('ready', handle.ready());
    document.documentElement.style.setProperty("--colNum", 7);
    document.documentElement.style.setProperty('--primFila', '30px');
  });

});

Template.PorSala.rendered = function() {
  //Inicializa el selector de fecha
  $('#fecha').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    setDate: Session.get('fecha'),
  });
}

Template.PorSala.helpers({
  salaActiva() {
    return Session.get('sala');
  },
  fecha() { //Retorna la fecha seleccionada
    return Session.get('fecha');
  },
  tablaReservas() { //Retorna la tabla con todas las reservas
    let semana = Session.get('semana');
    let sala = Session.get('sala');
    let modulos = Session.get('modulos');

    let celdas = [];

    for (let fila = 0; fila < 9; fila += 1) { //9 módulos
      celdas[fila] = [];
      for (let columna = 0; columna < 7; columna += 1) { //7 días

        //Módulo vacío
        celdas[fila][columna] = [{
          sala: sala,
          ini: semana[columna],
          fin: semana[columna],
          dias: [{fecha: semana[columna], modulo: fila}],
          fechaSelect: semana[columna],
          moduloSelect: fila,
          horario: [0, 0, 0, 0, 0, 0, 0],
          actividad: (modulos[fila] == 'almuerzo') ? 'A' : 'Disponible',
        }];

        let reservas = Reservas.find({ sala: sala, dias: {$elemMatch: {fecha: semana[columna], modulo: fila}} }).fetch();

        for (let i in reservas) {
          reservas[i].fechaSelect = semana[columna];
          reservas[i].moduloSelect = fila;
          reservas[i].ini = reservas[i].dias[0].fecha;
          reservas[i].fin = reservas[i].dias[reservas[i].dias.length - 1].fecha;
          celdas[fila][columna][i] = reservas[i];
        }
      }
    }

    return celdas;
  },
  diasSemana() { //Retorna los días de la semana
    let hoy = moment().format("dd D/M");
    let diaSel = moment(Session.get('fecha') + ' 12:00').format("dd D/M");
    let dias = Session.get('diasSemana');
    let diasSemana = [];
    for (let d in dias) {
      diasSemana.push({
        dia: dias[d],
        hoy: (dias[d] == hoy) ? 'red' : '',
        diaSel: (dias[d] == diaSel) ? 'diaSel' : ''
      });
    }

    return diasSemana;
  },
  modulos() { //Retorna los nombres y horarios de los módulos
    return Session.get('textoModulo');
  },
  accion() { //Cambia la acción del click dependiendo de la fecha y del rol del usuario
    if (this.fechaSelect < Session.get('hoy')) return 'desactivado';
    if (Roles.userIsInRole(Meteor.userId(), 'admin')) return 'js-editaModulo';
    return 'desactivado';
  },
  repite() { //Agrega un pin si es una reserva con repetición
    if (this.dias[0].fecha != this.dias[this.dias.length - 1].fecha) return true;
    return false;
  },
  masDeUna(celda) {
    if (celda.length > 1) return 'masDeUna';
    return '';
  },
  superpuestas() {
    let modulos = Session.get('modulos');
    let superpuestas = Calendario.find({ cuenta: {$gt: 3} }).fetch();
    for (let i in superpuestas) {
      superpuestas[i].txt = superpuestas[i].sala + " / " + superpuestas[i].fecha + " - Módulo: " + modulos[superpuestas[i].modulo];
    }
    return superpuestas;
  }
});

Template.PorSala.events({
  'change #fecha'(event) { //Cambio en el selector de fecha
    updateFechas(event.target.value);
  },
  'click .js-resSuper'() {
    Modal.show('ResSuper');
  },
  'click .js-editaModulo'() { //Muestra el modal para editar módulos
    if (this.actividad == 'Disponible') this.actividad = '';
    Modal.show('EditaModulo', this);
  },
  'click .js-semanaAnt'() { //Retrocede la fecha una semana
    cambiaFecha(-7);
    $('#fecha').datepicker('update', Session.get('fecha'));
  },
  'click .js-semanaSig'() { //Adelanta la fecha una semana
    cambiaFecha(7);
    $('#fecha').datepicker('update', Session.get('fecha'));
  },
  'click .js-verReserva'() {
    updateFechas(this.fecha);
    Session.set('sala', this.sala);
  },
});
