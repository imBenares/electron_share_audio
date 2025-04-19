const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require("multer");

const app = express();
const port = 3000;

// 允许跨域访问
app.use(cors());
app.use(bodyParser.json());

// 配置 MySQL 连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  //  MySQL 用户名
    password: 'Benares1231',  //  MySQL 密码
    database: 'user'        //要连接的数据库名
});

// 连接 MySQL
db.connect(err => {
    if (err) {
        console.error('数据库连接失败:', err);
        return;
    }
    console.log('成功连接到 MySQL 数据库!!!');
});

const audiostorage = multer.diskStorage({
  // 指定存储目录
  destination: function (req, file, cb) {
      cb(null, 'D:/audio_file_base'); // 文件将存储在 D:\audio_file_base 目录下
  },
  // 指定文件名
  filename: function (req, file, cb) {
      cb(null, file.fieldname + '_' + file.originalname); // 生成完整文件名
  }
});

const imagestorage = multer.diskStorage({
  // 指定存储目录
  destination: function (req, file, cb) {
      cb(null, 'D:/headshot_base'); // 文件将存储在 D:\audio_file_base 目录下
  },
  // 指定文件名
  filename: function (req, file, cb) {
      cb(null, file.fieldname + '_' + file.originalname); // 生成完整文件名
  }
});

const uploadAudio = multer({ 
  storage: audiostorage ,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const uploadImage = multer({ 
  storage: imagestorage ,
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use((req, res, next) => {
  console.log(`收到请求: ${req.method} ${req.url}`);
  next();
});

app.post('/upload/audio', uploadAudio.single('file'), async (req, res) => {
  let tagIds;
  let audioId = null;
  const filepath = `D:/audio_file_base/${req.file.filename}`;
  //获取文件在服务器上的存储位置
  const fileInfo = JSON.parse(req.body.fileInfo);
  //获取从主进程发送来的文件信息
  const tags = fileInfo.tag;
  //提取文件信息里的tag数据
  const placeholders = tags.map(() => '?').join(',');
  const { audioname, 
    username, 
    userid, 
    size,  
    duratime, 
    bitrate, 
    samplerate, 
    channels, 
    tag,
    private
  } = fileInfo;
  try {
    const placeholders = tags.map(() => '?').join(',');
    const query1 = `SELECT id FROM tag_id WHERE tag IN (${placeholders})`;
    db.query(query1, tags, (err, results) => {
      if (err) {
        console.error("error:", err);
        return res.status(500).json({ error: "数据库查询错误" });
      }else{
        tagIds = results.map(row => row.id);
        //console.log(tagIds);
      }
    })
    const query2 = 'SELECT MIN(id) FROM audio_info WHERE is_deleted = 1';
    db.query(query2,(err,results) => {
      if(results){
        const value = results[0]['MIN(id)'];
        // console.log( results[0]);
        // console.log(value);
        if(value){
          audioId = value;
          const delete_tags = 'DELETE FROM file_tags WHERE file_id = ?';
          db.query(delete_tags,[value],(err,results) => {
            if(results){
              //console.log(results);
              const update = 'UPDATE audio_info SET audio_name = ?,user_name = ?, user_id = ?, size = ?, duratime = ?, bitrate = ?, samplerate = ?, channels = ?, private = ?, upload_time = NOW(), audiopath = ?, is_deleted = 0 WHERE id= ?';
              db.query(update,[audioname, username, userid, size,  duratime, bitrate, samplerate, channels, private, filepath, value],(err,results) => {
                if(results){
                  console.log(results);
                  insertTagId(audioId,tagIds)
                }else{
                  console.log(err);
                }
              })
            }else{
              console.log(err); 
            }
          })
        }else{
          const insert = 'INSERT INTO audio_info (audio_name, user_name, user_id, size, duratime, bitrate, samplerate, channels, private, upload_time, audiopath, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)'
          db.query(insert,[audioname, username, userid, size,  duratime, bitrate, samplerate, channels, private, filepath, 0],(err,results) =>{
            if(results){
              console.log(results);
              audioId = results.insertId;
              insertTagId(audioId,tagIds)
            }else{
              console.log(err);
              
            }
          })
        }
      }else{
        console.log('err:',err);
        
      }
    })
  } catch (error) {
    
  }  

  function insertTagId(audioId,tagIds){
    const file_id = audioId;
    const insertFileTagQuery = 'INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)';
    const insertPromises = tagIds.map(tag_id => {
      return new Promise((resolve, reject) => {
        db.query(insertFileTagQuery, [file_id, tag_id], (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    })
    Promise.all(insertPromises)
    .then(() => {
      res.json({ success: true, message: "Upload successful", file_id });
    })
    .catch(err => {
      console.error("Error inserting into file_tag:", err);
      res.status(500).json({ error: "Failed to insert file_tag relationships" });
    });
  }

})

app.post('/upload/image',uploadImage.single('file'),async(req, res) => {
  console.log(req.body.userid);
  

  const filePath = `D:/headshot_base/${req.file.filename}`;
  const query = 'UPDATE user_information SET headshotpath = ? , md5 = ? WHERE id = ?';  

  try{
    db.query(query,[filePath ,req.body.md5 ,req.body.userid],(err,results) => {
      if(err){
        console.log(err);
        return res.status(500).json({ success:false, error: "头像上传失败" });
      }
      if(results.affectedRows > 0){
        return res.json({ success: true, message: '登录成功' });
      }
    })
    
  }catch(err){
    console.log(err);
    
  }
})

// 处理用户登录
app.post('/login', (req, res) => {
    //创建api
    const { username, password } = req.body;
    const query = 'SELECT * FROM user_login WHERE username = ? AND password = ?';
    //查询语句
    
    db.query(query, [username, password], (err, results) => {
        if (err) {
            res.json({ message: '服务器错误' });
            return;
        }
        if (results.length > 0) {
            //console.log(results);
          
            res.json({ id: results[0].id, name:results[0].username, success: true, message: '登录成功' });
        } else {
            res.json({ success: false, message: '用户名或密码错误' });
        }
    });
});


app.post('/register', async (req, res) => {
  const { username, password, gender, birthdate, email, tel } = req.body;

  try {
    // 查询用户名是否已被注册
    const [results] = await db.promise().query('SELECT * FROM user_login WHERE username = ?', [username]);
    console.log('查询结果:', results);
    if (results.length > 0) {
      return res.json({ message: 1 }); // 用户已注册
    }

    // 开始事务
    await db.promise().beginTransaction();
    console.log('开启事务');

    // 插入 user_login 表
    const [loginResult] = await db.promise().query("INSERT INTO user_login (username, password) VALUES (?, ?)", [username, password]);
    console.log('插入 user_login 表成功, user_id:', loginResult.insertId); // 输出插入的 ID
    if (!loginResult.insertId) {
      throw new Error("插入 user_login 失败"); // 如果没有获取到 insertId，抛出错误
    }
    const userId = loginResult.insertId; // 获取插入的用户 ID

    // 插入 user_information 表
    const [infoResult] = await db.promise().query("INSERT INTO user_information (user_id, id, username, gender, birthdate, email, tel) VALUES (?, ?, ?, ?, ?, ?, ?)", [userId, userId, username, gender, birthdate, email, tel]);
    console.log('插入 user_information 表成功, info_result:', infoResult);

    // 提交事务
    await db.promise().commit();
    console.log('事务提交成功');
    return res.json({ success: true });

  } catch (error) {
    console.error('发生错误:', error);
    await db.promise().rollback(); // 回滚事务
    return res.json({ message: "用户注册失败", error: error.message });
  }
});

app.post('/getInfo', (req, res) => {
  //创建api
  const { userId } = req.body;
  const query = 'SELECT * FROM user_information WHERE id = ?';
  //查询语句
  db.query(query, [userId], (err, results) => {
      if (err) {
          res.json({ message: '服务器错误' });
          return;
      }
      if (results.length > 0) {
        res.json({ results:results[0], success: true, message: '返回成功' });
      } else {
        res.json({ success: false, message: 'id错误' });
      }
  });
});

app.post('/editinfo', (req, res) => {
  //创建api
  const { username, gender, birthdate, email, tel, userid } = req.body;
  const query = 'UPDATE user_information SET username = ?,gender = ?, birthdate = ?,email = ?, tel = ? WHERE id = ?';
  //查询语句
  
  db.query(query, [username, gender, birthdate, email, tel ,userid], (err, results) => {
      if (err) {
          res.json({ message: '服务器错误' });
          return;
      }
      if (results) {
          res.json({ success: true, message: 1 });
      } 
  });
});

app.post('/editpassword', (req, res) => {
  //创建api
  const { username, password } = req.body;
  const query = 'UPDATE user_login SET password = ? WHERE username = ?';
  //查询语句
  
  db.query(query, [password, username], (err, results) => {
      if (err) {
          res.json({ message: '服务器错误' });
          return;
      }
      if (results) {
          res.json({ success: true, message: 1 });
      } 
  });
});

app.post('/checkheadshotmd5',(req,res) => {
  const { userid } = req.body;
  //console.log(req.body);
  const query = 'SELECT md5 FROM user_information WHERE id = ?' 
  db.query(query,[userid],(err,results) => {
    console.log(results[0].md5);
    
    if (err) {
      res.json({ message: '服务器错误' });
      return;
  }
  if(!results[0].md5){
    console.log("checkheadshotmd5");
    res.json({ value:false });
  }else{
      res.json({ value:true, message: results[0].md5 });
  } 
  })
  
})

app.post('/getheadshotinfo',(req,res) => {
  console.log('@@@@@@@@@@@@@@@@@@@@');
  
  const { userid } = req.body;
  console.log(userid);
  
  const query = 'SELECT headshotpath FROM user_information WHERE id = ?';
  db.query(query,[userid], (err, results) =>{
    console.log(results[0].headshotpath);
    
    if(err){
      res.json({ message: '服务器错误' });
      return;
    }
    if(!results[0].headshotpath){
      console.log("getheadshotinfo");
      
      res.json({ value:false });
    }else{
      const filepath = results[0].headshotpath;
      const filename = path.basename(filepath);

      console.log(filepath);
      console.log(filename);
      
      res.json({ value:true, filename:filename, filepath:filepath });
    }
  })
  
})

app.get('/getheadshot/:userid',(req,res) => {
  console.log('###########################');
  
  const { userid } = req.params;

  const query = 'SELECT headshotpath FROM user_information WHERE id = ?';
  db.query(query,[userid], (err, results) =>{
    if(err){
      res.json({ message: '服务器错误' });
      return;
    }

    const filePath = results[0].headshotpath;
    res.download(filePath, (err) => {
        if (err) {
          console.error('文件下载失败:', err);
          if (!res.headersSent) {
              res.status(500).json({ success: false, message: '文件下载失败' });
          }
        }
    })
  })
  
})

app.post('/getaudiolist',(req,res) =>{
  const { userid } = req.body;
  //console.log(userid);
  
  const query = 'SELECT * FROM audio_info WHERE user_id = ? AND is_deleted = 0'
  db.query(query,[userid],(err,results) => {
    
    console.log(results);
    
    if(err){
      console.log(err);
    }else{
      res.json({results:results})
    }
  })
})

app.get('/stream/audio/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  let cleanupDone = false;
  // 连接中断处理逻辑
  const cleanup = () => {
    if (cleanupDone) return;
    cleanupDone = true;
    req.destroy();  // 销毁请求对象
    res.destroy();  // 销毁响应对象
    console.log(`[${fileId}] 连接已安全终止`);
  };
  // 监听中断事件
  req.on('aborted', cleanup);
  req.socket.on('error', cleanup);
  // 数据库查询
  db.query('SELECT audiopath FROM audio_info WHERE id = ?', [fileId], (err, results) => {
    if (err || !results?.length) {
      return res.status(404).json({ error: '文件未找到' });
    }
    const filePath = path.resolve(results[0].audiopath);
    
    // 创建可读流
    const stream = fs.createReadStream(filePath)
      .on('open', () => {
        // 设置固定MIME类型
        res.type('audio/mpeg');
        
        // 处理Range请求
        const range = req.headers.range;
        if (range) {
          const stats = fs.statSync(filePath);
          const fileSize = stats.size;
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          // 验证范围有效性
          if (start >= fileSize || end >= fileSize) {
            res.status(416).header({ 'Content-Range': `bytes */${fileSize}` }).end();
            return cleanup();
          }
          // 发送分片
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': end - start + 1,
            'Accept-Ranges': 'bytes'
          });
          stream.close(); // 关闭原流
          fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
          // 发送完整文件
          res.header('Accept-Ranges', 'bytes');
          stream.pipe(res);
        }
      })
      .on('error', (err) => {
        if (err.code === 'ENOENT') res.status(404).end();
        else res.status(500).end();
        cleanup();
      });
    // 流传输完成处理
    res.on('finish', cleanup);
  });
});


app.post('/deleteaudio',(req,res) => {
  const {fileId} = req.body;
  const query = 'UPDATE audio_info SET is_deleted = 1 WHERE id = ?';
  db.query(query,[fileId],(err,results) => {
    //console.log(results);
    if(err){
      console.log(err);
      res.json({success:false});
    }else{
      res.json({success:true});
    }
  })
  
})



// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});