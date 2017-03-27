import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Reservas } from '/imports/api/collections/collections.js';

import './EditaModulo.html';

Template.EditaModulo.onCreated(function() {
  Session.set('tipo', 3);
});


Template.EditaModulo.rendered = function(){
  $('#integrantes').select2();
}

Template.EditaModulo.helpers({
  reservas(prioridad) {
    reserva = Reservas.findOne({sala: this.sala, fecha: this.fecha, modulo: this.modulo, prioridad: prioridad});

    if (!reserva) {
      return {
        sala: this.sala,
        fecha: this.fecha,
        modulo: this.modulo,
        prioridad: prioridad,
        actividad: '',
        integrantes: [''],
      }
    }

    return reserva;

  },
  tipo() {
    return Session.get('tipo');
  },
  usuarios() {
    return Session.get('usuarios');
  },
  esIntegrante(usuario) {
    if ( _.contains(this.integrantes, usuario) ) return "selected";
  },
});

Template.EditaModulo.events({
  'click .js-tipo1'() {
    Session.set('tipo', 1);
  },
  'click .js-tipo2'() {
    Session.set('tipo', 2);
  },
  'click .js-tipo3'() {
    Session.set('tipo', 3);
  },
  'submit #reservaForm'(event, template) {
    event.preventDefault();

    let id = this._id;
    let sala = this.sala;
    let fecha = this.fecha;
    let modulo = this.modulo;
    let prioridad = this.prioridad;
    let actividad = event.target.actividad.value;
    let integrantes = _.pluck( _.filter(event.target.integrantes.options, (i) => {return i.selected}) , 'value');

    if (!id) {
      Meteor.call('nuevaReserva', sala, fecha, modulo, prioridad, actividad, integrantes);
    }
    else {
      Meteor.call('modificaReserva', id, actividad, integrantes);
    }

    Modal.hide();
  },
  'click .js-eliminar'() {
    Meteor.call('eliminaReserva', this._id);
    Modal.hide();
  }
});
