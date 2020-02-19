import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Reservas } from '/imports/api/collections/collections.js';

import './EditaModulo.html';
import '../../partials/SelectorDeHorario.js';

Template.EditaModulo.onCreated(function() {
  Session.set('horario', this.data.horario);
});

Template.EditaModulo.rendered = function(){
  $('#integrantes').select2();
  $('#repiteHasta').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: this.data.dias[this.data.dias.length - 1].fecha,
  });
}

Template.EditaModulo.helpers({
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
  repiteHasta() { //Retorna la última fecha de la reserva
    return this.dias[this.dias.length - 1].fecha;
  },
});

Template.EditaModulo.events({
  'submit #reservaForm'(event, template) {
    event.preventDefault();

    let id = this._id;
    let sala = this.sala;
    let dias = this.dias;
    let actividad = event.target.actividad.value;
    let integrantes = _.pluck( _.filter(event.target.integrantes.options, (i) => {return i.selected}) , 'value');
    let repiteHasta = event.target.repiteHasta.value;
    let horario = Session.get('horario');
    let hayHorario = horario.reduce((a,b) => a+b);

    console.log(hayHorario);
    if (!repiteHasta || !actividad || !hayHorario) return false;

    if (!id) { //Si es una nueva reserva
      Meteor.call('nuevaReservaAdmin', sala, dias, horario, actividad, integrantes, repiteHasta, 2, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    } else { //Si modifica una reserva existente
      // Meteor.call('modificaReserva', id, actividad, integrantes, modulos, repiteHasta, dias, (err,res) => {
      //   if (err) Session.set('err', err.reason);
      // });
    }

    //Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  },
  'click .js-eliminar'() {
    Meteor.call('eliminaReserva', this._id);
    Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  },
  'click .js-eliminaEstaFecha'() {
    Meteor.call('eliminaEstaFecha', this._id, this.estaFecha);
    Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  }
});
