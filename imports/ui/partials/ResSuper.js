import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './ResSuper.html';

Template.ResSuper.onCreated(function() {
  this.autorun( () => {
    Meteor.call('reservasSuperpuestas', (err,res) => {
      if (!err) Session.set('superpuestas', res);
    });
  });
});

Template.ResSuper.helpers({
  superpuestas() {
    let res = Session.get('superpuestas');
    return res;
  }
});
