const express = require('express');
const multer = require('multer');
const routes = express.Router();
const fs = require('fs');


// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/app/upload_image');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// ... [ Tus otras rutas ] ...

routes.get('/list/users', (req, res)=>{
    req.getConnection((err, conn)=>{
        if(err) return res.send(err)

        conn.query('SELECT * FROM Users', (err, data)=>{
            if(err) return res.send(err)

            res.json({data})
        })
    })
})

routes.get('/list/users/fav', (req, res)=>{
    req.getConnection((err, conn)=>{
        if(err) return res.send(err)

        conn.query('select * from Favoritos INNER JOIN Users ON Users.id_user = Favoritos.id_user', (err, data)=>{
            if(err) return res.send(err)

            res.json({data})
        })
    })
})

// Ruta para obtener un solo usuario basado en su ID
routes.get('/user/:id', (req, res) => {
  req.getConnection((err, conn) => {
      if (err) return res.send(err);

      // Usamos una sentencia para prevenir inyección SQL
      conn.query('SELECT * FROM Users WHERE id_user = ?', [req.params.id], (err, data) => {
          if (err) return res.send(err);

          if(data.length) {
              res.json({ data: data[0] }); // Retornamos solo el primer elemento ya que es único
          } else {
              res.status(404).send('Usuario no encontrdado'); // 404 es el código de estado para "No encontrado"
          }
      });
  });
});

routes.post('/register/user', upload.single('imagen'), (req, res) => {
    const { nombre, apellido, edad, correo, telefono, sexo } = req.body;
    const imagenPath = req.file ? req.file.path : null;

    req.getConnection((err, conn) => {
        if(err) return res.send(err);

        const query = 'INSERT INTO Users (nombre, apellido, edad, correo, telefono, sexo, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)';
        conn.query(query, [nombre, apellido, edad, correo, telefono, sexo, imagenPath], (err, results) => {
            if(err) return res.send(err);

            res.json({ success: true, message: 'Usuario registrado satisfactoriamente!' });
        });
    });
});

routes.put('/update/user/:id', upload.single('imagen'), (req, res) => {
    const { nombre, apellido, edad, correo, telefono, sexo } = req.body;
    const imagenPath = req.file ? req.file.path : null;

    console.log(req.params.id); // Para verificar el ID
    console.log(req.body); 

    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        let query;
        let data;
        
        // Si se ha subido una nueva imagen, actualizamos la columna 'imagen' en la base de datos
        if (imagenPath) {
            query = 'UPDATE Users SET nombre = ?, apellido = ?, edad = ?, correo = ?, telefono = ?, sexo = ?, imagen = ? WHERE id_user = ?';
            data = [nombre, apellido, edad, correo, telefono, sexo, imagenPath, req.params.id];
        } else {
            // Si no hay una nueva imagen, solo actualizamos los otros campos
            query = 'UPDATE Users SET nombre = ?, apellido = ?, edad = ?, correo = ?, telefono = ?, sexo = ? WHERE id_user = ?';
            data = [nombre, apellido, edad, correo, telefono, sexo, req.params.id];
        }

        conn.query(query, data, (err, results) => {
            if (err) return res.send(err);
            
            if (results.affectedRows > 0) { 
                res.json({ success: true, message: 'Usuario actualizado sastifactoriamente!' });
            } else {
                res.status(404).send('Error al actualizar');
            }
        });
    });
});

routes.delete('/delete/user/:id', (req, res) => {
    const userId = req.params.id;

    // Consultar la ruta de la imagen del usuario en la base de datos
    req.getConnection((err, conn) => {
        if(err) return res.send(err);

        // obtenemos la ruta de la imagen
        const getImagePathQuery = 'SELECT imagen FROM Users WHERE id_user = ?';
        conn.query(getImagePathQuery, [userId], (err, results) => {
            if(err) return res.send(err);

            const imagePath = results[0]?.imagen;

            //Eliminar la imagen del sistema de archivos
            if (imagePath && fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            //Eliminar el usuario de la base de datos
            const deleteUserQuery = 'DELETE FROM Users WHERE id_user = ?';
            conn.query(deleteUserQuery, [userId], (err) => {
                if(err) return res.send(err);

                res.json({ success: true, message: 'Usuario eliminado satisfactoriamente!' });
            });
        });
    });
});


routes.post('/add/user/fav', (req, res) => {
    const { id_user } = req.body; 
    
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const query = 'INSERT INTO Favoritos (id_user) VALUES (?)';        
        conn.query(query, [id_user], (err, results) => {
            if (err) return res.send(err);

            res.json({ success: true, message: "Usuario registrado en fav"})
        });
    });
});


routes.delete('/delete/user/fav/:id', (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const query = 'DELETE FROM Favoritos WHERE id_user = ?';
        
        conn.query(query, [req.params.id], (err, results) => {
            if (err) return res.send(err);

            if (results.affectedRows > 0) { 
                res.json({ success: true, message: 'Usuario eliminado de fav sastisfactoriamente!' });
            } else {
                res.status(404).send('Usuario no encontrado');
            }
        });
    });
});

module.exports = routes;