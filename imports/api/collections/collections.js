import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Salas = new Mongo.Collection('salas');
export const Reservas = new Mongo.Collection('reservas');
export const Calendario = new Mongo.Collection('calendario');
export const Cursos = new Mongo.Collection('cursos');
export const Camara = new Mongo.Collection('camara');
export const Config = new Mongo.Collection('config');
export const Log = new Mongo.Collection('log');
