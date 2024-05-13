const express = require('express')
const multer = require('multer');
const app = express();
const crypto = require('crypto')
const fs = require('fs')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'EncryptPool')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })

const algorithm = 'aes-256-ctr';
let key = 'MySuperSecretKey';
key = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);

const encrypt = (buffer) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
};

const decrypt = (encrypted) => {
   const iv = encrypted.slice(0, 16);
   encrypted = encrypted.slice(16);
   const decipher = crypto.createDecipheriv(algorithm, key, iv);
   const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
   return result;
};

app.listen(8080, () => 
    console.log('Server started on port 8080')
);

app.get('/',function(req,res){
    res.sendFile(__dirname + '/index.html');
  });

app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
    res.send('Successfully uploaded file')
    var gettingEncrypted = fs.readFileSync('./EncryptPool/'+file.originalname)
    var encrypted = encrypt(gettingEncrypted)
    fs.writeFileSync('./NAS/'+file.originalname, encrypted, function (err) {
        if (err) throw err;
        console.log('Wrote to encrypted site');
    });
    try{
    fs.unlinkSync('./EncryptPool/'+file.originalname)
        } catch(err) {
            console.error(err)
        }
})

app.post('/uploadfileToBeDecrypted', upload.single('myFileToBeDecrypted'), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }
      res.send('Successfully uploaded file to be decrypted')
      var gettingDecrypted = fs.readFileSync('./EncryptPool/'+file.originalname)
      var decrypted = decrypt(gettingDecrypted)
      fs.writeFileSync('./NAS/'+file.originalname, decrypted, function (err) {
          if (err) throw err;
          console.log('Decrypted file');
      });
      try{
        fs.unlinkSync('./EncryptPool/'+file.originalname)
            } catch(err) {
                console.error(err)
            }
  })
