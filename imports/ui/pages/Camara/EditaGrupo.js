import { Template } from 'meteor/templating';
import { Camara } from '/imports/api/collections/collections.js';

import './EditaGrupo.html';

Template.EditaGrupo.rendered = function(){
  $('#profesor').select2();
  $('#integrantesCamara').select2();
}

Template.EditaGrupo.helpers({
  usuarios() {
    return Session.get('usuarios');
  },
  esProfesor(usuario) { //Marca como preseleccionados los usuarios que están en la reserva
    if ( _.contains(this.profesor, usuario) ) return 'selected';
  },
  esIntegrante(usuario) { //Marca como preseleccionados los usuarios que están en la reserva
    if ( _.contains(this.integrantes, usuario) ) return 'selected';
  },
});

Template.EditaGrupo.events({
  'submit #camaraForm'(event, template) {
    event.preventDefault();

    let profesor = event.target.nombre.value;
    let integrantes = _.pluck( _.filter(event.target.integrantes.options, (i) => {return i.selected}) , 'value');

    if (this._id) {
      Meteor.call('editaGrupo', this._id, profesor, integrantes);
    } else {
      Meteor.call('creaGrupo', profesor, integrantes);
    }

    template.find("form").reset();
    Modal.hide();
  },
  'click .js-borraGrupo'(event, template) {
    Meteor.call('borraGrupo', this._id);

    template.find("form").reset();
    Modal.hide();
  },
});
