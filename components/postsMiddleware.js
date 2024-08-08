const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {/* 
   Obtén el token del encabezado de autorización */
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado' });
  }

  try {
    /*  Verifica y decodifica el token */
    const decoded = jwt.verify(token, 'claveSecreta'); 

   /*  Coloca la información del usuario en req.user */
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Token no válido' });
  }
};

module.exports = authenticateUser;
