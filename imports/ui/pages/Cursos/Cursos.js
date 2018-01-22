import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Cursos } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';
import { Config } from '/imports/api/collections/collections.js';

import './Cursos.html';
import './EditaCurso.js';

var nuevoSemestre = function() {
  let anio = Session.get('anio');
  let semestre = Session.get('semestre');
  let fechasSemestre = Config.findOne({anio: anio, semestre: semestre});

  Session.set('fechasSemestre', fechasSemestre);
}

var updateDTPickers = function() {
  let sem = Session.get('fechasSemestre');
  if (!sem) {
    let anio = Session.get('anio');
    let semestre = Session.get('semestre');
    let ini = (semestre == 1) ? '-03-01' : '-08-01';
    let fin = (semestre == 1) ? '-07-15' : '-12-15';

    sem = {
      iniUniv: anio + ini,
      finUniv: anio + fin,
      iniCE: anio + ini,
      finCE: anio + fin,
    }
  }

  $('#iniUniv').datepicker('update', sem.iniUniv);
  $('#finUniv').datepicker('update', sem.finUniv);
  $('#iniCE').datepicker('update', sem.iniCE);
  $('#finCE').datepicker('update', sem.finCE);
}

Template.Cursos.onCreated(function() {
  this.autorun( () => {
    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    Subs.subscribe('config');
    let anio = Session.get('anio');
    let semestre = Session.get('semestre');

    //Se suscribe a los cursos de un determinado semestre
    let handle = Subs.subscribe('cursos', anio, semestre);
    Session.set('ready', handle.ready());

    //Carga las fechas de inicio y fin para el semestre seleccionado
    nuevoSemestre();
  });
});

Template.Cursos.rendered = function() {
  let fechasSemestre = Session.get('fechasSemestre');

  //Inicializa el selectores de fecha
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

  $('#iniUniv').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: fechasSemestre.iniUniv,
  });

  $('#finUniv').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: fechasSemestre.finUniv,
  });

  $('#iniCE').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: fechasSemestre.iniCE,
  });

  $('#finCE').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: fechasSemestre.finCE,
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
  fechasSemestre() {
    return Session.get('fechasSemestre');
  },
  esSemestre(sem) {
    if (sem == Session.get('semestre')) return 'selected';
  },
  txtDia() {
    if (!this.horario) return false;

    let dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
    let horario = this.horario;

    let txt = horario.map((m) => {
      return m.dias.map((d) => {return dias[d]}).join(', ') + ': ' + m.modulo;
    });

    return txt.join('; ');
  },
});

Template.Cursos.events({
  'change #anio'(event) {
    Session.set('anio', event.target.value);
    nuevoSemestre();
    updateDTPickers();
  },
  'change #semestre'(event) {
    Session.set('semestre', event.target.value);
    nuevoSemestre();
    updateDTPickers();
  },
  'change #iniUniv'(event) {
    Meteor.call('fechasSemestre', Session.get('anio'), Session.get('semestre'), 'iniUniv', event.target.value);
  },
  'change #finUniv'(event) {
    Meteor.call('fechasSemestre', Session.get('anio'), Session.get('semestre'), 'finUniv', event.target.value);
  },
  'change #iniCE'(event) {
    Meteor.call('fechasSemestre', Session.get('anio'), Session.get('semestre'), 'iniCE', event.target.value);
  },
  'change #finCE'(event) {
    Meteor.call('fechasSemestre', Session.get('anio'), Session.get('semestre'), 'finCE', event.target.value);
  },
  'click .js-nuevoCursoUniv'() {
    let sem = Session.get('fechasSemestre');
    Modal.show('EditaCurso', {ini: sem.iniUniv, fin: sem.finUniv});
  },
  'click .js-nuevoCursoCE'() {
    let sem = Session.get('fechasSemestre');
    Modal.show('EditaCurso', {ini: sem.iniCE, fin: sem.finCE});
  },
  'click .js-editaCurso'() {
    Modal.show('EditaCurso', this);
  }
});
