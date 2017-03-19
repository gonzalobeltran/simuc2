import './Header.html';
import './Ayuda.html';
import './Reglamento.html';

Template.Header.onCreated(function(){
  this.ayuda = new ReactiveVar(false);
  this.reglamento = new ReactiveVar(false);
});

Template.Header.helpers({
  usuario() {
    let n = Meteor.user().profile.nombre;
    if (n =='Display') return 'Display';
    let pos = n.indexOf(' ');
    let usuario = n[0] + ". " + n.slice(pos);
    return usuario;
  },
  ayuda() {
    return Template.instance().ayuda.get();
  },
  aunNoAcepta() {
    if (Meteor.user()) {
      return !Meteor.user().profile.reglamento;
    }
  },
  reglamento() {
    return Template.instance().reglamento.get();
  },
});

Template.Header.events({
  'click .js-signOut'() {
    AccountsTemplates.logout();
  },
  'click .js-ayuda'() {
    Template.instance().ayuda.set(true);
  },
  'click .js-cierraAyuda'() {
    Template.instance().ayuda.set(false);
  },
  'click .js-reglamento'() {
    Template.instance().reglamento.set(true);
  },
  'click .js-cierraReglamento'() {
    Template.instance().reglamento.set(false);
  },
  'click .js-acepto'() {
    Meteor.call('aceptaReglamento');
    Template.instance().reglamento.set(false);
  },
  'click .js-rechazo'() {
    AccountsTemplates.logout();
    Template.instance().reglamento.set(false);
  },
  'click .js-print'() {
    window.print();
  },
  'click .menu-btn'() {
    $('.menu').addClass('expand');
  },
  'click a'() {
    $('.menu').removeClass('expand');
  },
});
