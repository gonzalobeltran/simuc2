import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
//import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Salas = new Mongo.Collection('salas');
export const Reservas = new Mongo.Collection('reservas');
export const Camara = new Mongo.Collection('camara');
export const Config = new Mongo.Collection('config');
