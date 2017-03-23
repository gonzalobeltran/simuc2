import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './Header.html';
import './Ayuda.html';
import './Reglamento.js';

Template.Header.onCreated(function() {
  this.autorun( () => {
    if (Meteor.user() && !Meteor.user().profile.reglamento) {
      Modal.show('Reglamento', true, {backdrop: 'static', keyboard: false});
    }
  });
});

Template.Header.helpers({
  menu() {
    let menu = [
      {txt: 'Display',              role: 'display',    route: 'display',   icon: 'glyphicon-facetime-video'},
      {txt: 'Mis Reservas',         role: 'usuario',    route: 'reservas',  icon: 'glyphicon-pencil'},
      {txt: 'Ver por sala',         role: 'usuario',    route: 'porsala',   icon: 'glyphicon-calendar'},
      {txt: 'Salas y prioridades',  role: 'usuario',    route: 'salas',     icon: 'glyphicon-list'},
      {txt: 'Cámara',               role: 'admin',      route: 'camara',    icon: 'glyphicon-music'},
      {txt: 'Usuarios',             role: 'admin',      route: 'usuarios',  icon: 'glyphicon-user'},
      {txt: 'Log',                  role: 'superadmin', route: 'log',       icon: 'glyphicon-book'},
      {txt: 'Config',               role: 'superadmin', route: 'config',     icon: 'glyphicon-wrench'},
    ];

    return menu;
  },
});

Template.Header.events({
  'click .js-ayuda'() {
    Modal.show('Ayuda');
  },
  'click .js-reglamento'() {
    Modal.show('Reglamento');
  },
  'click .js-signOut'() {
    AccountsTemplates.logout();
  },
});
