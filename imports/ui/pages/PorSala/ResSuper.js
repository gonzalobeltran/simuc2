import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './ResSuper.html';

Template.ResSuper.onCreated(function() {
  Meteor.call('reservasSuperpuestas', (err,res) => {
    if (!err) Session.set('superpuestas', res);
  });
});

Template.ResSuper.helpers({
  superpuestas() {
    if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
      let res = Session.get('superpuestas');
      return res;
    }
  }
});

Template.ResSuper.events({
  'click .js-verReserva'() {
    updateFechas(this.fechas);
    Session.set('sala', this.sala);
    Modal.hide();
  }
});
