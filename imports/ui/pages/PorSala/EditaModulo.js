import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Reservas } from '/imports/api/collections/collections.js';

import './EditaModulo.html';
import '../../partials/SelectorDeHorario.js';

Template.EditaModulo.onCreated(function() {
  let binModulos = Session.get('binModulos');
  let horario = this.data.horario;
  if (!horario.reduce((a,b) => a+b)) horario[moment(this.data.fechaSelect).weekday()] = binModulos[this.data.moduloSelect];

  Session.set('horario', horario);
});

Template.EditaModulo.rendered = function(){
  $('#integrantes').select2();
  $('#ini').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: this.data.ini,
  });
  $('#fin').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: this.data.fin,
  });
}

Template.EditaModulo.helpers({
  fechaSeleccionada() {
    let modulos = Session.get('modulos');
    return( moment(this.fechaSelect).format('dd DD MMM YYYY') + ' - Módulo ' + modulos[this.moduloSelect]);
  },
  usuarios() {
    return Session.get('usuarios');
  },
  esIntegrante(usuario) { //Marca como preseleccionados los usuarios que están en la reserva
    if ( _.contains(this.integrantes, usuario) ) return 'selected';
  },
  repite() { //Indica si es una reserva que tiene más de una fecha, para cambiar los botones que se muestran
    if (this.dias.length > 1) return true;
    return false;
  },
  ini() { //Retorna la primera fecha de la reserva
    return this.ini;
  },
  fin() { //Retorna la última fecha de la reserva
    return this.fin;
  },
});

Template.EditaModulo.events({
  'submit #reservaForm'(event, template) {
    event.preventDefault();

    let id = this._id;
    let sala = Session.get('sala');
    let ini = event.target.ini.value;
    let fin = event.target.fin.value;
    let horario = Session.get('horario');
    let hayHorario = horario.reduce((a,b) => a+b);
    let actividad = event.target.actividad.value;
    let integrantes = _.pluck( _.filter(event.target.integrantes.options, (i) => {return i.selected}) , 'value');

    if (!ini || !fin || !actividad || !hayHorario) return false;

    if (!id) { //Si es una nueva reserva
      Meteor.call('nuevaReservaAdmin', sala, actividad, integrantes, 2, ini, fin, horario, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    } else { //Si modifica una reserva existente
      Meteor.call('modificaReserva', id, sala, actividad, integrantes, ini, fin, horario, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    }

    //Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  },
  'click .js-eliminar'() {
    Meteor.call('eliminaReserva', this._id);
    Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  },
  'click .js-eliminaFechaSelect'() {
    Meteor.call('eliminaFechaSelect', this._id, this.fechaSelect);
    Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  }
});
