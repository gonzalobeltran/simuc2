import { Config } from '/imports/api/collections/collections.js';

import './Config.html';

Template.Config.onCreated(function() {
  Session.set('ok', '');
});

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
  maxDCSelected(index) {
    let config = Session.get('config');
    if (config.maxDCPorSemana == index + 1) return "selected";
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
      maxDCPorSemana: event.target.maxDC.value,
      mensaje: event.target.mensaje.value,
    }

    Meteor.call('cambiaConfig', config, (err, res) => {
      if (!err) Session.set('ok', 'Configuración guardada');
    });
  },
  'click #resetReglamento'() {
    Meteor.call('resetReglamento');
  },
  'click #actualizaDB'() {
    Meteor.call('actualizaDB');
  },
});
