import { Template } from 'meteor/templating';
import { Salas } from '/imports/api/collections/collections.js';

import './EditaSala.html';

Template.EditaSala.helpers({
  actividades() {
    return Session.get('actividades');
  },
  esPrioridad(actividad) {
    if (this.prioridad && _.contains(this.prioridad, actividad) ) return "selected";
  },
  esAceptado(actividad) {
    if (this.acepta && _.contains(this.acepta, actividad) ) return "selected";
  },
});

Template.EditaSala.events({
  'submit #salaForm'(event, template) {
    event.preventDefault();

    let nombre = event.target.nombre.value;
    let prioridad = _.pluck( _.filter(event.target.prioridad.options, (i) => {return i.selected}) , 'value');
    let acepta = _.pluck( _.filter(event.target.acepta.options, (i) => {return i.selected}) , 'value');

    if (this._id) {
      Meteor.call('editaSala', this._id, nombre, prioridad, acepta);
    } else {
      Meteor.call('creaSala', nombre, prioridad, acepta);
    }

    template.find("form").reset();
    $('#editaSala').modal('toggle');
  },
  'click .js-borraSala'(event, template) {
    Meteor.call('borraSala', this._id);

    template.find("form").reset();
    $('#editaSala').modal('toggle');
  },
});
