import './Header.html';
import './Ayuda.html';
import './Reglamento.html';

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
  aunNoAcepta() {
    if (Meteor.user()) {
      return !Meteor.user().profile.reglamento;
    }
  },
});

Template.Header.events({
  'click .js-signOut'() {
    AccountsTemplates.logout();
  },
  'click .js-print'() {
    window.print();
  },
  'click .js-acepto'() {
    Meteor.call('aceptaReglamento');
  },
  'click .js-rechazo'() {
    AccountsTemplates.logout();
  },
});
