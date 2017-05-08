import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Reservas } from '/imports/api/collections/collections.js';

import './EditaModulo.html';


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
    language: "es"
  });
}

Template.EditaModulo.helpers({
  usuarios() {
    return Session.get('usuarios');
  },
  esIntegrante(usuario) {
    if ( _.contains(this.integrantes, usuario) ) return "selected";
  },
  repite() {
    if (this.fechaIni != this.repiteHasta) return true;
    return false;
  }
});

Template.EditaModulo.events({
  'submit #reservaForm'(event, template) {
    event.preventDefault();

    let id = this._id;
    let sala = this.sala;
    let fecha = this.fecha;
    let repiteHasta = event.target.repiteHasta.value;
    let modulo = this.modulo;
    let prioridad = this.prioridad;
    let actividad = event.target.actividad.value;
    let integrantes = _.pluck( _.filter(event.target.integrantes.options, (i) => {return i.selected}) , 'value');

    if (!id) {
      Meteor.call('nuevaReservaAdmin', sala, fecha, modulo, 2, actividad, integrantes, repiteHasta, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    }
    else {
      Meteor.call('modificaReserva', id, actividad, integrantes, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    }

    Modal.hide();
  },
  'click .js-eliminar'() {
    Meteor.call('eliminaReserva', this._id);
    Modal.hide();
  },
  'click .js-eliminaEstaFecha'() {
    Meteor.call('eliminaEstaFecha', this._id, this.estaFecha);
    Modal.hide();
  }
});
