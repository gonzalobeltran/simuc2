import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './Header.html';
import './Ayuda.html';
import './Reglamento.js';

Template.Header.onCreated(function() {
  this.autorun( () => {
    if (Meteor.user()) {
      //Guarda el nombre del usuario
      Session.set('usuario', Meteor.user().profile.nombre);

      //Muestra el reglamento si el usuario aún no lo acepta
      if (!Meteor.user().profile.reglamento) {
        Modal.show('Reglamento', true, {backdrop: 'static', keyboard: false});
      }

      // Obtiene la lista de usuarios y la guarda en una variable de sesión
      Meteor.call('listaUsuarios', (err,res) => {
        if (!err) Session.set('usuarios', res);
      });
    }
  });
});

Template.Header.rendered = function() {
  $("#menu").click(function () {
    $("#menu").collapse('hide');
  });
}

Template.Header.helpers({
  hayError() {
    return Session.get('err');
  },
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
