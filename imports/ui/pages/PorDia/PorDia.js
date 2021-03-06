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

    if (Meteor.user() && Meteor.user().profile.salasSeleccionadas) {
      Session.set('salasSeleccionadas', Meteor.user().profile.salasSeleccionadas);
    }
    else {
      Session.set('salasSeleccionadas', '');
    }

    document.documentElement.style.setProperty('--colNum', Session.get('salasSeleccionadas').length);
    document.documentElement.style.setProperty('--primFila', '65px');

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
    let fecha = Session.get('fecha');
    let numModulos = Session.get('numModulos');

    let celdas = [];

    for (let fila = 0; fila < numModulos; fila += 1) { //módulos
      celdas[fila] = [];
      for (let columna in salas) { //Todas las salas

        //Módulo vacío
        celdas[fila][columna] = [{
          sala: salas[columna],
          ini: fecha,
          fin: fecha,
          dias: [{fecha: semana[columna], modulo: fila}],
          fechaSelect: fecha,
          moduloSelect: fila,
          horario: [0, 0, 0, 0, 0, 0, 0],
          actividad: (modulos[fila] == 'A') ? 'A' : 'Disponible',
        }];

        let reservas = Reservas.find({sala: salas[columna], dias: {$elemMatch: {fecha: fecha, modulo: fila}} }).fetch();

        for (let i in reservas) {
          reservas[i].fechaSelect = fecha;
          reservas[i].moduloSelect = fila;
          reservas[i].ini = reservas[i].dias[0].fecha;
          reservas[i].fin = reservas[i].dias[reservas[i].dias.length - 1].fecha;
          celdas[fila][columna][i] = reservas[i];
        }
      }
    }

    return celdas;
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
  'click .js-diaAnt'() { //Retrocede la fecha un día
    cambiaFecha(-1);
    $('#fechaDia').datepicker('update', Session.get('fecha'));
  },
  'click .js-diaSig'() { //Adelanta la fecha un día
    cambiaFecha(1);
    $('#fechaDia').datepicker('update', Session.get('fecha'));
  },
});
