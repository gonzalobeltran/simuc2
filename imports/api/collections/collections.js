import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Salas = new Mongo.Collection('salas');
export const Reservas = new Mongo.Collection('reservas');
export const Camara = new Mongo.Collection('camara');
export const Config = new Mongo.Collection('config');
