import { Accounts } from 'meteor/accounts-base';

process.env.MAIL_URL = "smtp://salasinstitutodemusicauc:clavesalasimuc789@smtp.gmail.com:587/";

Accounts.emailTemplates.siteName = "Salas IMUC";
Accounts.emailTemplates.from = "Salas IMUC <no-reply@salasimuc.cl>";

Accounts.emailTemplates.resetPassword = {
  subject(user) {
    return "Reiniciar clave";
  },
  text(user, url) {
    url = url.replace('#/', '');
    return `Hola!

Haz click en el siguente link para reiniciar tu clave:
${url}

Por favor, ignora este correo si no lo has solicitado.

Gracias!
`
  }
};

Accounts.emailTemplates.enrollAccount = {
  subject(user) {
    return "Cuenta creada";
  },
  text(user, url) {
    url = url.replace('#/', '');
    return `Hola!

Se ha creado una cuenta para ti en salasimuc.cl
Haz click en el siguiente link para crear una clave:
${url}

Gracias!
`
  }
};
