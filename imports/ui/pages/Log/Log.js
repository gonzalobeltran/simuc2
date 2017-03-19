import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Reservas } from '/imports/api/collections/collections.js';

import './Log.html';

Template.Log.onCreated(function() {

  Subs.clear();

  this.autorun( () => {
    this.subscribe('reservasLog', Session.get('logFiltro'), Session.get('logStep'));
  });
});

Template.Log.helpers({
  //Retorna la lista de usuarios que pasan el filtro de búsqueda
  log() {
    let rxp = new RegExp(Session.get('logFiltro'), 'i');

    return Reservas.find({$or: [
      {sala: {$regex: rxp}},
      {fecha: {$regex: rxp}},
      {timestamp: {$regex: rxp}},
      {owner: {$regex: rxp}},
      {'res1.actividad': {$regex: rxp}},
      {'res2.actividad': {$regex: rxp}},
      {'perm.actividad': {$regex: rxp}},
    ]}, {sort: {timestamp: -1}, limit: 15});
  },
  act() {
    if (this.res1) return this.res1.actividad;
    if (this.res2) return this.res2.actividad;
    if (this.perm) return this.perm.actividad;
  },
  nomModulo(m) {
    if (m == 9) return 'Almuerzo';
    return m;
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
  'click .js-GoTo'() {
    Session.set('sala', this.sala);
    if (this.fecha != '-') updateFechas(this.fecha);
    FlowRouter.go('/semana');
  }
});
