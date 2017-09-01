import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Cursos } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './Cursos.html';
import './EditaCurso.js';

Template.Cursos.onCreated(function() {
  this.autorun( () => {
    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    //Se suscribe a los cursos de un determinado semestre
    let handle = Subs.subscribe('cursos', Session.get('anio'), Session.get('semestre'));
    Session.set('ready', handle.ready());
  });
});

Template.Cursos.rendered = function() {
  //Inicializa el selector de fecha
  $('#anio').datepicker({
    format: 'yyyy',
    viewMode: 2,
    minViewMode: 2,
    maxViewMode: 2,
    autoclose: true,
    disableTouchKeyboard: true,
    language: "es",
    setDate: Session.get('fecha'),
  });
}

Template.Cursos.helpers({
  cursos() {
    return Cursos.find({anio: Session.get('anio'), semestre: Session.get('semestre')});
  },
  anio() {
    return Session.get('anio');
  },
  semestre() {
    return Session.get('semestre');
  },
  esSemestre(sem) {
    if (sem == Session.get('semestre')) return 'selected';
  },
});

Template.Cursos.events({
  'change #anio'(event) {
    Session.set('anio', event.target.value);
  },
  'change #semestre'(event) {
    Session.set('semestre', event.target.value);
  },
  'click .js-nuevoCurso'() {
    Modal.show('EditaCurso', '');
  },
  'click .js-editaCurso'() {
    Modal.show('EditaCurso', this);
  }
});
