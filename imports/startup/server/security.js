import { Meteor } from 'meteor/meteor';

// Bloquea la modificación de usuarios desde el cliente
Meteor.users.deny({
  update() {return true;},
});
