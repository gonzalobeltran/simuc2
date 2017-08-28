import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Cursos } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './Cursos.html';
import './EditaCurso.js';

Template.Cursos.onCreated(function() {

  Session.set('cursoSeleccionado', null);

  let mods = ['1', '2', '3', 'A', '4', '5', '6', '7', '8'];
  let selBox = [];

  for(let m = 0; m < 9; m += 1) {
    selBox[m] = [];
    for (let d = 0; d < 5; d += 1) {
      selBox[m][d] = {
        txt: mods[m],
        marca: '',
        dia: d,
        modulo: m
      }
    }
  }

  Session.set('selBox', selBox);

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
  cursoSeleccionado() {
    return('cursoSeleccionado');
  },
  salas() { //Lista de salas
    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    return salas;
  },
  isSelected(sala) { //Marca la sala seleccionada
    if (sala == this.sala) return 'selected';
  },
  dias() {
    let dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    return dias;
  },
  modulos() {
    return Session.get('selBox');
  }
});

Template.Cursos.events({
  'change #anio'(event) {
    Session.set('anio', event.target.value);
  },
  'change #semestre'(event) {
    Session.set('semestre', event.target.value);
  },
  'click .js-marcaModulo'() {
    let selBox = Session.get('selBox');
    selBox[this.modulo][this.dia].marca = (selBox[this.modulo][this.dia].marca == '') ? 'marcado' : '';
    Session.set('selBox', selBox);
  },
  'click .js-creaCurso'() {

  },
  'click .js-editaCurso'() {

  }
});
