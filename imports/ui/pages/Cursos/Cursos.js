import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Cursos } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';
import { Config } from '/imports/api/collections/collections.js';

import './Cursos.html';
import './EditaCurso.js';

var nuevoSemestre = function() {
  let periodo = Session.get('periodo');
  let fechasPeriodo = Config.findOne({periodo: periodo});

  Session.set('fechasPeriodo', fechasPeriodo);
}

var updateDTPickers = function() {
  let fechas = Session.get('fechasPeriodo');
  if (!fechas) {
    fechas = {
      ini: moment().format('YYYY'),
      fin: moment().format('YYYY'),
    }
  }

  $('#ini').datepicker('update', fechas.ini);
  $('#fin').datepicker('update', fechas.fin);
}

Template.Cursos.onCreated(function() {
  this.autorun( () => {
    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    Subs.subscribe('config');

    //Se suscribe a los cursos de un determinado periodo
    let handle = Subs.subscribe('cursos', Session.get('periodo'));
    Session.set('ready', handle.ready());

    //Carga las fechas de inicio y fin para el semestre seleccionado
    nuevoSemestre();
  });
});

Template.Cursos.rendered = function() {
  let fechasPeriodo = Session.get('fechasPeriodo');

  //Inicializa los selectores de fecha
  $('#ini').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: fechasPeriodo.ini,
  });

  $('#fin').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: fechasPeriodo.fin,
  });
}

Template.Cursos.helpers({
  cursos() {
    return Cursos.find({periodo: Session.get('periodo')}, {sort: {nombre: 1, profesor: 1}});
  },
  periodo() {
    return Session.get('periodo');
  },
  periodos() {
    let lista = ['Anual', '1er Sem', '2o Sem', 'Conjuntos estables'];

    return lista;
  },
  fechasPeriodo() {
    return Session.get('fechasPeriodo');
  },
  esPeriodo(periodo) {
    if (periodo == Session.get('periodo')) return 'selected';
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
  'change #periodo'(event) {
    Session.set('periodo', event.target.value);
    nuevoSemestre();
    updateDTPickers();
  },
  'click .js-nuevoCurso'() {
    let fechas = Session.get('fechasPeriodo');
    Modal.show('EditaCurso', {ini: fechas.ini, fin: fechas.fin});
  },
  'click .js-editaCurso'() {
    Modal.show('EditaCurso', this);
  },
  'submit #fechasPeriodoForm'(event, template) {
    event.preventDefault();
    let periodo = event.target.periodo.value;
    let fechaIni = event.target.fechaIni.value;
    let fechaFin = event.target.fechaFin.value;

    Meteor.call('fechasPeriodo', periodo, fechaIni, fechaFin)
  },
});
