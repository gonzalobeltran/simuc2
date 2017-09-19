import { Template } from 'meteor/templating';
import { Camara } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './EditaGrupo.html';

Template.EditaGrupo.rendered = function(){
  $('#profesor').select2();
  $('#integrantesCamara').select2();
}

Template.EditaGrupo.helpers({
  salas() { //Lista de salas
    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    return salas;
  },
  isSelected(sala) { //Marca la sala seleccionada
    if (sala == this.sala) return 'selected';
  },
  esDia(dia) {
    if (this.dia == dia) return 'selected';
  },
  esModulo(modulo) {
    if (this.modulo == modulo) return 'selected';    
  },
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

    let profesor = _.pluck( _.filter(event.target.profesor.options, (i) => {return i.selected}) , 'value');
    let integrantes = _.pluck( _.filter(event.target.integrantes.options, (i) => {return i.selected}) , 'value');
    let sala = event.target.sala.value;
    let dia = event.target.diaCamara.value;
    let modulo = event.target.moduloCamara.value;

    if (!profesor.length || !integrantes.length) return false;

    if (this._id) {
      Meteor.call('editaGrupo', this._id, profesor, integrantes, sala, dia, modulo);
    } else {
      Meteor.call('creaGrupo', profesor, integrantes, sala, dia, modulo);
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
