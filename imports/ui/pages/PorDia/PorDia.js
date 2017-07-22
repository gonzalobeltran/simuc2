import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Reservas } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './PorDia.html';
import '../PorSala/EditaModulo.js';

Template.PorDia.onCreated(function(){
  this.autorun( () => {
    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    //Se suscribe a las reservas de la sala activa y la semana activa, de lunes a domingo
    let handle = Subs.subscribe('reservasDia', Session.get('fecha'));
    Session.set('ready', handle.ready());

    if (Meteor.user()) {
      Session.set('salasSeleccionadas', Meteor.user().profile.salasSeleccionadas);
    }

  });
});

Template.PorDia.rendered = function() {
  //Inicializa el selector de fecha
  $('#fechaDia').datepicker({
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

Template.PorDia.helpers({
  salas() { //Lista de salas
    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    return salas;
  },
  salasSeleccionadas() {
    return Session.get('salasSeleccionadas');
  },
  esSala(sala) {
    if (_.contains(Session.get('salasSeleccionadas'), sala) ) return "selected";
  },
  fecha() { //Retorna la fecha seleccionada
    return Session.get('fecha');
  },
  tablaReservas() { //Retorna la tabla con todas las reservas
    let semana = Session.get('semana');
    let salas = Session.get('salasSeleccionadas');
    let modulos = Session.get('modulos');

    let celdas = [];

    for (let fila = 0; fila < 9; fila += 1) { //9 módulos
      celdas[fila] = [];
      for (let columna in salas) { //Todas las salas

        //Módulo vacío
        celdas[fila][columna] = [{
          sala: salas[columna],
          fechas: [Session.get('fecha')],
          estaFecha: Session.get('fecha'),
          modulos: [modulos[fila]],
          actividad: (modulos[fila] == 'almuerzo') ? '-' : 'Disponible',
        }];

        let reservas = Reservas.find({sala: salas[columna], fechas: Session.get('fecha'), modulos: modulos[fila]}).fetch();

        for (let i in reservas) {
          reservas[i].estaFecha = Session.get('fecha');
          celdas[fila][columna][i] = reservas[i];
        }

      }
    }

    return celdas;
  },
  modulo(index) { //Retorna los nombres y horarios de los módulos
    let modulo = Session.get('textoModulo');
    return modulo[index];
  },
  accion() { //Cambia la acción del click dependiendo de la fecha y del rol del usuario
    if (this.estaFecha < Session.get('hoy')) return 'desactivado';
    if (Roles.userIsInRole(Meteor.userId(), 'admin')) return 'js-editaModulo';
    return 'desactivado';
  },
  repite() { //Agrega un pin si es una reserva con repetición
    if (this.fechas.length > 1) return true;
    return false;
  },
  masDeUna(celda) {
    if (celda.length > 1) return 'masDeUna';
    return '';
  }
});

Template.PorDia.events({
  'change #fechaDia'(event) { //Cambio en el selector de fecha
    updateFechas(event.target.value);
  },
  'change #salas'(event) { //Cambia la selección de salas
    let salas = _.pluck( _.filter(event.target.options, (i) => {return i.selected}) , 'value');
    Meteor.call('seleccionaSalas', salas);
  },
  'click .js-editaModulo'() { //Muestra el modal para editar módulos
    if (this.actividad == 'Disponible') this.actividad = '';
    Modal.show('EditaModulo', this);
  },
  'click .js-diaAnt'() { //Retrocede la fecha una semana
    cambiaFecha(-1);
    $('#fechaDia').datepicker('update', Session.get('fecha'));
  },
  'click .js-diaSig'() { //Adelanta la fecha una semana
    cambiaFecha(1);
    $('#fechaDia').datepicker('update', Session.get('fecha'));
  },
});
