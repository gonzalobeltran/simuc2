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

Template.Header.rendered = function() {
  $("#menu").click(function () {
    $("#menu").collapse('hide');
  });
}

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
  hayError() {
    return Session.get('err');
  }
});

Template.Header.events({
  'click .menu-btn'() {
    $('.menu-bkg').addClass('mostrar');
    $('.menu').addClass('expand');
  },
  'click a'() {
    $('.menu-bkg').removeClass('mostrar');
    $('.menu').removeClass('expand');
  },
  'click .menu-bkg'() {
    $('.menu-bkg').removeClass('mostrar');
    $('.menu').removeClass('expand');
  },
  'click .js-ayuda'() {
    Modal.show('Ayuda');
  },
  'click .js-reglamento'() {
    Modal.show('Reglamento');
  },
  'click .js-signOut'() {
    AccountsTemplates.logout();
  },
  'click .js-cierraError'() {
    Session.set('err', '');
  }
});
