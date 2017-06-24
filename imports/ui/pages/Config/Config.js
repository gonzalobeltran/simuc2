import { Config } from '/imports/api/collections/collections.js';

import './Config.html';

Template.Config.onCreated(function() {
  Session.set('ok', '');
});

Template.Config.rendered = function() {
  $('#fecha1').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: new Date(),
  });

  $('#fecha2').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: new Date(),
  });

  $('#fecha3').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: new Date(),
  });
}

Template.Config.helpers({
  doc() {
    return Session.get('config');
  },
  modulos() {
    let m = [1, 2, 3, 4, 5, 6, 7, 8];
    return m;
  },
  maxReservasSelected(index) {
    let config = Session.get('config');
    if (config.maxReservas == index + 1) return "selected";
  },
  maxCamaraSelected(index) {
    let config = Session.get('config');
    if (config.maxCamaraPorSemana == index + 1) return "selected";
  },
  ok() {
    return Session.get('ok');
  }
});

Template.Config.events({
  'submit #configForm'(event, template) {
    event.preventDefault();

    let config = {
      maxReservas: event.target.maxReservas.value,
      maxCamaraPorSemana: event.target.maxCamara.value,
      mensaje: event.target.mensaje.value,
      fecha1: event.target.fecha1.value,
      fecha2: event.target.fecha2.value,
      fecha3: event.target.fecha3.value,
    }

    Meteor.call('cambiaConfig', config, (err, res) => {
      if (!err) Session.set('ok', 'Configuración guardada');
    });
  },
  'click #resetReglamento'() {
    Meteor.call('resetReglamento');
  },
});
