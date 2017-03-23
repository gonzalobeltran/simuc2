import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './Reglamento.html';

Template.Reglamento.events({
  'click .js-acepto'() {
    Meteor.call('aceptaReglamento');
    Modal.hide();
  },
  'click .js-rechazo'() {
    AccountsTemplates.logout();
    Modal.hide();
  },
});
