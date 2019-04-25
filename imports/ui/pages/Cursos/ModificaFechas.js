import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './ModificaFechas.html';

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

Template.ModificaFechas.onCreated(function() {
});

Template.ModificaFechas.rendered = function() {
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

Template.ModificaFechas.helpers({
  periodo() {
    return Session.get('periodo');
  },
  periodos() {
    let lista = ['Anual', '1er Sem', '2o Sem', 'Conjuntos estables'];

    return lista;
  },
  esPeriodo(periodo) {
    if (periodo == Session.get('periodo')) return 'selected';
  },
  fechasPeriodo() {
    return Session.get('fechasPeriodo');
  },
});

Template.ModificaFechas.events({
  'submit #fechasPeriodoForm'(event, template) {
    event.preventDefault();
    let periodo = Session.get('periodo');
    let fechaIni = event.target.fechaIni.value;
    let fechaFin = event.target.fechaFin.value;

    Meteor.call('fechasPeriodo', periodo, fechaIni, fechaFin)
    Modal.hide();
  },
});
