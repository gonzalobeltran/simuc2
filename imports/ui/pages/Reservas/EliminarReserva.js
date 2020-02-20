import { Meteor } from 'meteor/meteor';

import { Reservas } from '/imports/api/collections/collections.js';

import './EliminarReserva.html';

Template.EliminarReserva.helpers({
  repite() {
    if (this.dias.length > 1) return true;
    return false;
  }
});

Template.EliminarReserva.events({
  'click .js-eliminaReserva'() { //Elimina la reserva
    Meteor.call('eliminaReserva', this._id);
    Modal.hide();
  },
});
