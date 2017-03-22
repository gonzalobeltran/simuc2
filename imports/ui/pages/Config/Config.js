import { Config } from '/imports/api/collections/collections.js';
import { Schema } from '/imports/api/collections/schemas.js';

import { resetReglamento } from '/imports/api/collections/methods.js';

import './Config.html';

Template.Config.helpers({
  config() {
    return Schema.config;
  },
  doc() {
    return Session.get('config');
  }
});

Template.Config.events({
  'click #resetReglamento'() {
    Meteor.call('resetReglamento');
  }
});
