import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Reservas } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './PorSala.html';
import './EditaModulo.js';
import './ResSuper.js';

Template.PorSala.onCreated(function(){
  this.autorun( () => {
    let semana = Session.get('semana');

    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    //Se suscribe a las reservas de la sala activa y la semana activa, de lunes a domingo
    let handle = Subs.subscribe('reservasSala', Session.get('sala'), semana[0], semana[6]);
    Session.set('ready', handle.ready());

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
  salas() { //Lista de salas
    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    if (!Session.get('sala')) Session.set('sala', salas[0]);
    return salas;
  },
  isSelected(sala) { //Marca la sala seleccionada
    if (sala == Session.get('sala')) return 'selected';
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
          fechas: [semana[columna]],
          estaFecha: semana[columna],
          modulos: [modulos[fila]],
          actividad: (modulos[fila] == 'almuerzo') ? '-' : 'Disponible',
        }];

        let reservas = Reservas.find({sala: sala, fechas: semana[columna], modulos: modulos[fila]}).fetch();

        for (let i in reservas) {
          reservas[i].estaFecha = semana[columna];
          celdas[fila][columna][i] = reservas[i];
        }

      }
    }

    return celdas;
  },
  diasSemana() { //Retorna los días de la semana
    return Session.get('diasSemana');
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

Template.PorSala.events({
  'change .js-salaSelect'(event) { //Selector de sala
    Session.set('sala', event.target.value);
  },
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
});
