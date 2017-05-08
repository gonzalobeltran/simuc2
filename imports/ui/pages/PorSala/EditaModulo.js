import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Reservas } from '/imports/api/collections/collections.js';

import './EditaModulo.html';


Template.EditaModulo.rendered = function(){
  $('#integrantes').select2();
}

Template.EditaModulo.helpers({
  reserva() {
    Session.set('estaFecha', this.fecha);

    reserva = Reservas.findOne({sala: this.sala, fecha: this.fecha, modulo: this.modulo, prioridad: 2});

    if (!reserva) {
      return {
        sala: this.sala,
        fecha: this.fecha,
        modulo: this.modulo,
        prioridad: 2,
        actividad: '',
        integrantes: [''],
        esFija: false
      }
    }

    return reserva;
  },
  reservaSP() {
    reserva = Reservas.findOne({sala: this.sala, fecha: this.fecha, modulo: this.modulo, prioridad: 1});

    if (!reserva) {
      return {
        sala: this.sala,
        fecha: this.fecha,
        modulo: this.modulo,
        prioridad: 1,
        actividad: '',
        integrantes: [''],
        esFija: false
      }
    }

    return reserva;
  },
  usuarios() {
    return Session.get('usuarios');
  },
  esIntegrante(usuario) {
    if ( _.contains(this.integrantes, usuario) ) return "selected";
  },
});

Template.EditaModulo.events({
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
      Meteor.call('nuevaReserva', sala, fecha, modulo, prioridad, actividad, integrantes, false, (err,res) => {
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
    Meteor.call('eliminaEstaFecha', this._id, Session.get('estaFecha'));
    Modal.hide();
  }
});
