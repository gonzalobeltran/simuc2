import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Cursos } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './EditaCurso.html';
import '../../partials/SelectorDeHorario.js';

Template.EditaCurso.onCreated(function() {
  Session.set('horario', this.data.horario);
});

Template.EditaCurso.helpers({
  salas() { //Lista de salas
    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    return salas;
  },
  isSelected(sala) { //Marca la sala seleccionada
    if (sala == this.sala) return 'selected';
  },
});

Template.EditaCurso.events({
  'click .js-eliminaCurso'() {
    Meteor.call('eliminaCurso', this._id);
    Modal.hide();
  },
  'submit #editaCursoForm'(event, template) {
    event.preventDefault();

    let periodo = Session.get('periodo');
    let nombre = event.target.nombre.value;
    let profesor = event.target.profesor.value;
    let sala = event.target.sala.value;
    let horario = Session.get('horario');

    if (!nombre || !profesor || !sala || !horario.length) return false;

    if (this._id) {
      Meteor.call('modificaCurso', this._id, periodo, this.ini, this.fin, nombre, profesor, sala, horario);
    } else {
      Meteor.call('creaCurso', periodo, this.ini, this.fin, nombre, profesor, sala, horario);
    }

    template.find("form").reset();
    Modal.hide();
  },
});
