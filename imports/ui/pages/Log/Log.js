import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Log } from '/imports/api/collections/collections.js';

import './Log.html';

Template.Log.onCreated(function() {

  Subs.clear();

  this.autorun( () => {
    this.subscribe('log', Session.get('logFiltro'), Session.get('logStep'));
  });
});

Template.Log.helpers({
  //Retorna la lista de usuarios que pasan el filtro de búsqueda
  log() {
    let rxp = new RegExp(Session.get('logFiltro'), 'i');

    let res = Log.find({$or: [
      {ts: {$regex: rxp}},
      {usuario: {$regex: rxp}},
      {sala: {$regex: rxp}},
      {accion: {$regex: rxp}},
      {actividad: {$regex: rxp}},
      {fechas: {$regex: rxp}},
      {modulos: {$regex: rxp}},
    ]}, {sort: {ts: -1}, limit: 15}).fetch();

    return res;
  },
  logFiltro() {
    return Session.get('logFiltro');
  },
  logStep() {
    return Session.get('logStep');
  },
});

Template.Log.events({
  'input #filtro'(event) {
    Session.set('logStep', 0);
    Session.set('logFiltro', event.target.value);
  },
  'click .js-Ant'() {
    let step = Session.get('logStep');
    step -= 15;
    if (step < 0) step=0;
    Session.set('logStep', step);
  },
  'click .js-Reset'() {
    Session.set('logStep', 0);
  },
  'click .js-Sig'() {
    let step = Session.get('logStep');
    step += 15;
    Session.set('logStep', step);
  },
});
