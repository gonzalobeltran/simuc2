import { Config } from '/imports/api/collections/collections.js';

// Espera la suscripción de los roles antes de iniciar las rutas
FlowRouter.wait();
Tracker.autorun(() => {
  if (Roles.subscription.ready() && !FlowRouter._initialized) {
    FlowRouter.initialize()
  }

  Meteor.subscribe('config');
  Session.set('config', Config.findOne({}));
});

Subs = new SubsManager({
    cacheLimit: 10,
    expireIn: 5
  });

Meteor.startup(function(){
  // Selecciona español
  T9n.setLanguage("es");
  T9n.map('es', {
    error: {
      accounts: {
        'Login forbidden': 'Usuario o contraseña inválido'
      }
    }
  });

//------- Variables de sesión
  // La sala seleccionada actualmente
  Session.set('sala', '');
  //Para la paginación del log
  Session.set('logStep', 0);
  //Filtro del log
  Session.set('logFiltro', '');
  //Para mostrar errores
  Session.set('err', '');
  //Para mostrar superposiciones
  Session.set('superpuestas', '');
  //En la página Mis Reservas, alterna entre vista de semana y de día
  Session.set('verDia', 0);
  //Día para mostrar en la página Mis Reservas (si la vista de un sólo día está seleccionada)
  Session.set('diaReserva', 0);
  //Periodo inicial en Cursos
  Session.set('periodo', 'Anual');

  let actividades = ['-',
  'Música de Cámara',
  'Dirección Coral',
  'Composición',
  'Piano',
  'Violín',
  'Viola',
  'Cello',
  'Guitarra',
  'Flauta',
  'Oboe',
  'Clarinete',
  'Fagot',
  'Flauta Dulce',
  'Laúd',
  'Viola da Gamba',
  'Canto',
  'Contrabajo',
  'Clavecín',
  'Corno',
  'Trompeta',
  'Trombón',
  'Tuba',
  'Saxofón',
  'Percusión'];

  Session.set('actividades', actividades);

  let textoModulo = [
    'Modulos',
    '1 (08:30-09:50)',
    '2 (10:00-11:20)',
    '3 (11:30-12:50)',
    'Almuerzo',
    '4 (14:00-15:20)',
    '5 (15:30-16:50)',
    '6 (17:00-18:20)',
    '7 (18:30-19:50)',
    '8 (20:00-21:20)'
  ];

  let modulos = [
    '1',
    '2',
    '3',
    'almuerzo',
    '4',
    '5',
    '6',
    '7',
    '8'
  ];

  Session.set('modulos', modulos);
  Session.set('textoModulo', textoModulo);

  // La fecha de hoy, en formato largo y corto
  Session.set('hoy', moment().format('YYYY-MM-DD'));
  Session.set('hoyCorto', moment(Session.get('hoy')).format('dd D/M'));
  var semanaDesdeHoy = [];
  var diasSemanaDesdeHoy = [];
  for (let d = 0; d < 7; d+=1) {
    // Guarda las fechas de una semana a partir de hoy
    semanaDesdeHoy.push( moment(Session.get('hoy')).add(d, 'day').format("YYYY-MM-DD") );
    diasSemanaDesdeHoy.push( moment(Session.get('hoy')).add(d, 'day').format("dd D/M") );
  }
  Session.set('semanaDesdeHoy', semanaDesdeHoy);
  Session.set('diasSemanaDesdeHoy', diasSemanaDesdeHoy);

  // Cambia las variables de sesión de fecha en función de la fecha seleccionada
  updateFechas = function(fecha) {
    fecha = fecha + ' 12:00';
    let semana = [];
    let diasSemana = [];
    for (let d = 0; d < 7; d+=1) {
      // Guarda las fechas de esta semana
      semana.push( moment(fecha).weekday(d).format("YYYY-MM-DD") );
      diasSemana.push( moment(fecha).weekday(d).format("dd D/M") );
    }
    Session.set('fecha', moment(fecha).format('YYYY-MM-DD'));
    Session.set('semana', semana);
    Session.set('diasSemana', diasSemana);
    Session.set('fechaCorta', moment(fecha).format('dd D/M'));
  }

  updateFechas(moment().format('YYYY-MM-DD'));

  cambiaFecha = function(dias) {
    let fecha = moment(Session.get('fecha')+' 12:00').add(dias, 'days').format('YYYY-MM-DD');
    updateFechas(fecha);
  }

  apellidos = function(lista) {
    let res = [];

    for (let i in lista) {
      let palabras = lista[i].split(' ');
      let apellido = palabras[palabras.length - 1];
      res.push(apellido);
    }

    return res.join(', ');
  }

  textoColor = function(txt) {
      //Posibilidades de colores
      let colores = [
        {r: 220, g: 76, b: 70}, //Grenadine
        {r: 246, g: 209, b: 85}, //Primrose Yellow
        {r: 0, g: 75, b: 141}, //Lapis Blue
        {r: 242, g: 85, b: 44}, //Flame
        {r: 87, g: 140, b: 169}, //Niagara
        {r: 90, g: 114, b: 71}, //Kale
        {r: 0, g: 89, b: 96}, //Shaded Spruce
        {r: 34, g: 58, b: 94}, //Navy Peony
        {r: 149, g: 222, b: 227}, //Island Paradise
        {r: 146, g: 181, b: 88}, //Greenery
        {r: 173, g: 93, b: 93}, //Dusty Cedar
      ];

      let max = (txt.length < 4) ? txt.length : 4;
      let sum1 = 0; sum2 = 0;

      //Elige el color con las tres primeras letras y el matiz con el resto del texto
      for (let i = 0; i < max; i += 1) sum1 += txt.charCodeAt(i);
      for (let i = max; i < txt.length; i += 1) sum2 += txt.charCodeAt(i);

      let i1 = sum1 % colores.length; //para elegir el color
      let i2 = (30 - (sum2 % 60)); //para elegir el matiz

      let r = limitar( colores[i1].r + i2, 0, 255);
      let g = limitar( colores[i1].g + i2, 0, 255);
      let b = limitar( colores[i1].b + i2, 0, 255);

      //Decide si el texto será oscuro o claro, dependiendo de la luminosidad
      let lum = 0.2126*r + 0.7152*g + 0.0722*b;
      let txtColor = (lum > 110) ? 'black' : 'white;'

      let color = 'rgb(' + r + ',' + g + ',' + b + ')';

      return 'background-color:' + color + '; color:' + txtColor + ';';
    }

    limitar = function(n, min, max) {
      if (n < min) return min;
      else if (n > max) return max;
      return n;
    }

//------- Helpers globales
  Handlebars.registerHelper('separaConComa', function(txt) {
    return txt.join(", ");
  });

  Handlebars.registerHelper('apellidos', function() {
    return apellidos(this.integrantes);
  });

  Handlebars.registerHelper('ready', function() {
    return Session.get('ready');
  });

  Handlebars.registerHelper('color', function() { //Cambia el color dependiendo de la reserva
    if (!this.actividad || this.actividad == 'A' || this.actividad == 'Disponible') return 'background-color: white; color: black;';
    if (this.prioridad == 1) return 'background-color: #e90; color: white;'

    return textoColor(this.actividad);
  });
});
