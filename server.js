const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require("multer");
const { useAttrs } = require('vue');
const { log } = require('console');

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

app.use((req, res, next) => {
  console.log(`收到请求: ${req.method} ${req.url}`);
  next();
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

app.post('/permission',async(req,res) => {
  const {userid} = req.body;
  const query = 'SELECT upload_permissions,comment_permissions FROM user_information WHERE id = ?';
  db.query(query,[userid],(err,results) => {
    if(err){
      console.log(err);
      return;
    }else{
      res.json({message: results});
    }
  })

})

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
              const update = `UPDATE audio_info SET 
                              audio_name = ?,
                              user_name = ?, 
                              user_id = ?, 
                              size = ?, 
                              duratime = ?, 
                              bitrate = ?, 
                              samplerate = ?, 
                              channels = ?, 
                              private = ?, 
                              upload_time = NOW(), 
                              audiopath = ?, 
                              is_deleted = 0 
                              WHERE id= ?`;
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
          const insert = `INSERT INTO audio_info (
                          audio_name, 
                          user_name, 
                          user_id, 
                          size, 
                          duratime, 
                          bitrate, 
                          samplerate, 
                          channels, 
                          private, 
                          upload_time, 
                          audiopath, 
                          is_deleted) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`;
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
            res.json({ id: results[0].id, name:results[0].username, key:results[0].is_admin, success: true, message: '登录成功' });
        } else {
            res.json({ success: false, message: '用户名或密码错误' });
        }
    });
});


app.post('/register', async (req, res) => {
  const { username, password, gender, birthdate, email, tel } = req.body;
  const select = 'SELECT * FROM user_login WHERE username = ?';

  try {
    // 查询用户名是否已被注册
    const [results] = await db.promise().query(select, [username]);
    if (results.length > 0) {
      return res.json({ message: 0 }); // 用户已注册
    }

    // 开始事务
    await db.promise().beginTransaction();

    // 插入 user_login 表
    const insert_login = 'INSERT INTO user_login (username, password,is_admin) VALUES (?, ?, ?)';
    const [loginResult] = await db.promise().query(insert_login, [username, password, 0]);
    if (!loginResult.insertId) {
      throw new Error("插入 user_login 失败");
    }
    const userId = loginResult.insertId;

    // 插入 user_information 表
    const insert_info = 'INSERT INTO user_information (user_id, id, username, gender, birthdate, email, tel, is_admin ,upload_permissions ,comment_permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)';
    const [infoResult] = await db.promise().query(insert_info, [userId, userId, username, gender, birthdate, email, tel, 0,1,1]);

    // 提交事务
    await db.promise().commit();
    res.json({ message: 1 }); // 注册成功

  } catch (error) {
    console.error('发生错误:', error);
    await db.promise().rollback(); // 回滚事务
    res.json({ message: "用户注册失败", error: error.message });
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
  //console.log('@@@@@@@@@@@@@@@@@@@@');
  
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
  //console.log('###########################');
  
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


app.post('/deleteaudio', (req, res) => {
  const { fileId } = req.body;

  // 先更新数据库记录
  const updateQuery = 'UPDATE audio_info SET is_deleted = 1 WHERE id = ?';
  db.query(updateQuery, [fileId], (err, updateResults) => {
    if (err) {
      console.log('数据库更新失败:', err);
      return res.json({ success: false, message: '数据库更新失败' });
    }

    // 查询音频文件路径
    const getFileQuery = 'SELECT audiopath FROM audio_info WHERE id = ?';
    db.query(getFileQuery, [fileId], (err, results) => {
      if (err || results.length === 0) {
        console.log('查询文件路径失败:', err || '无结果');
        return res.json({ success: false, message: '查询文件失败' });
      }
      console.log(results);
      
      const filePath = results[0].audiopath;

      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('文件删除失败:', unlinkErr);
          return res.json({ success: false, message: '文件删除失败' });
        }

        console.log('文件删除成功:', filePath);
        res.json({ success: true });
      });
    });
  });
});


app.post('/search', (req, res) => {

  const { keyword } = req.body; 

  if (!keyword) {
    return res.status(400).json({ error: '关键词不能为空' });
  }

  const keywords = keyword.split(' ').filter(k => k.trim() !== '');

  if (keywords.length === 0) {
    return res.status(400).json({ error: '无有效关键词' });
  }

  // 构造 WHERE 和匹配度 score
  const whereClauses = keywords.map(k => `audio_name LIKE ?`).join(' OR ');
  const scoreClauses = keywords.map(k => `(CASE WHEN audio_name LIKE ? THEN 1 ELSE 0 END)`).join(' + ');

  const sql = `
    SELECT *, (${scoreClauses}) AS match_score
    FROM audio_info
    WHERE ${whereClauses}
    ORDER BY match_score DESC
  `;

  const values = keywords.flatMap(k => [`%${k}%`, `%${k}%`]);

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ error: '数据库错误' });
    }else{
      //console.log(results);
      res.json(results);
    }
  });
});

app.get("/recommend", (req, res) => {
  db.query(
    `SELECT * FROM audio_info ORDER BY RAND() LIMIT 15`,
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ error: '数据库查询失败' });
      }

      res.json(results);
    }
  );
});

app.post("/category", (req, res) => {
  const{ Id } = req.body;
  
  const query1 = 'SELECT file_id FROM file_tags WHERE tag_id = ?'
  db.query(query1,[Id],(err,results) => {
    if (err) {
      console.error("查询 file_tags 错误：", err);
      return res.status(500).json({ error: "数据库错误" });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    const fileIds = results.map(row => row.file_id);
    const query2 = `SELECT * FROM audio_info WHERE id IN (${fileIds.map(() => '?').join(',')})`;
    db.query(query2, fileIds, (err2, audioResults) => {
      if (err2) {
        console.error("查询 audio_info 错误：", err2);
        return res.status(500).json({ error: "数据库错误" });
      }
      res.json(audioResults);
    });
  })
});

app.get('/downloadaudio/:id',(req,res) => {
  const { id } = req.params;
  const query = 'SELECT audiopath FROM audio_info WHERE id = ?';
  db.query(query,[id],(err,results) => {
    if(err){
      res.json({ message: '服务器错误' });
      return;
    }
    const filePath = results[0].audiopath;
    res.download(filePath, (err) => {
      if (err) {
        console.error('文件下载失败:', err);
      }
  })
    
  })
})

app.post('/submitcomment',(req,res) => {
  const {Id,commentcontent,userId,username} = req.body;
  const query = 'INSERT INTO comments (user_id,audio_id,content,user_name,created_at) VALUES (?,?,?,?,NOW())';
  db.query(query,[userId,Id,commentcontent,username],(err,results) => {
    if(err){
      console.log('err:',err);
    }else{
      res.json({message:true});
    }
  })
})

app.post('/getcomment',(req,res) => {
  const {Id} = req.body;
  const query = 'SELECT comments.content,comments.created_at,user_information.username, user_information.headshotpath FROM comments JOIN user_information ON comments.user_id = user_information.id WHERE comments.audio_id = ?;'
  db.query(query,[Id],(err,results) => {
    if(err){
      console.log(err);
    }else{
      res.json(results)
    }
  })
})

app.get('/recent-audio', (req, res) => {
  const query = `
    SELECT 
      ai.id, 
      ai.audio_name, 
      ai.upload_time,
      ai.user_name,
      ui.headshotpath,
      GROUP_CONCAT(t.tag) AS tags
    FROM audio_info ai
    JOIN user_information ui ON ai.user_id = ui.user_id
    LEFT JOIN file_tags ft ON ai.id = ft.file_id
    LEFT JOIN tag_id t ON ft.tag_id = t.id
    WHERE ai.is_deleted = 0
    GROUP BY ai.id
    ORDER BY ai.upload_time DESC
    LIMIT 100;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('查询失败:', err);
      res.status(500).json({ success: false, message: '数据库查询错误' });
    } else {
      // 将 tags 字符串转为数组
      const formattedResults = results.map(row => ({
        ...row,
        tags: row.tags ? row.tags.split(',') : []
      }));
      res.json({ success: true, data: formattedResults });
    }
  });
});

app.post('/saverename', (req, res) => {
    const {editname,userid,fileId} = req.body;
    const query_1 = 'SELECT is_admin FROM user_information WHERE id = ?';
    db.query(query_1,[userid],(err,results) => {
      if(err){
        console.log(err);
        return;
      }
      if(results[0].is_admin === 1){
        const query_2 = 'UPDATE audio_info SET audio_name = ? WHERE id = ?';
        db.query(query_2,[editname,fileId],(err,results) => {
          if(err){
            console.log(err);
          }else{
            res.json({success: true});
          }
        })
      }else{
        res.json({success: false});
      }
    })
});

app.get('/recent-comment', (req, res) => {
  const query = `
            SELECT 
            comments.id, 
            comments.content, 
            comments.created_at, 
            comments.user_id, 
            comments.user_name,
            user_information.headshotpath
            FROM comments
            JOIN user_information ON comments.user_id = user_information.user_id
            ORDER BY comments.created_at DESC
            LIMIT 100;
      `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('查询失败:', err);
      res.status(500).json({ success: false, message: '数据库查询错误' });
    } else {
      res.json({ success: true, data: results });
    }
  });
});

app.get('/recent-user', (req, res) => {
  const query = `
            SELECT * FROM user_information ;
      `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('查询失败:', err);
      res.status(500).json({ success: false, message: '数据库查询错误' });
    } else {
      res.json({ success: true, data: results });
    }
  });
});

app.post('/update-permission', (req, res) => {
  const { userId, uploadPermission, commentPermission } = req.body;

  if (typeof userId === 'undefined') {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  // 默认权限为1，如果参数未提供则不更新
  const upload = typeof uploadPermission !== 'undefined' ? uploadPermission : 1;
  const comment = typeof commentPermission !== 'undefined' ? commentPermission : 1;

  const sql = `
    UPDATE user_information
    SET upload_permissions = ?, comment_permissions = ?
    WHERE id = ?
  `;

  db.query(sql, [upload, comment, userId], (err, result) => {
    if (err) {
      console.error('权限更新失败:', err);
      return res.status(500).json({ success: false, message: '数据库更新失败' });
    }

    res.json({ success: true, message: '权限更新成功' });
  });
});

app.post('/savetags', (req, res) => {
  const { id, tags } = req.body;

  if (!id || !Array.isArray(tags)) {
    return res.status(400).json({ success: false, message: '参数不合法' });
  }

  // 查询 tag 名称对应的 tag_id
  const getTagIdsQuery = 'SELECT id, tag FROM tag_id WHERE tag IN (?)';
  db.query(getTagIdsQuery, [tags], (err, tagResults) => {
    if (err) {
      console.error('查询标签 ID 失败:', err);
      return res.status(500).json({ success: false, message: '查询标签失败' });
    }

    const tagIdMap = {};
    tagResults.forEach(row => {
      tagIdMap[row.tag] = row.id;
    });

    // 检查是否有不存在的标签
    const unknownTags = tags.filter(tag => !(tag in tagIdMap));
    if (unknownTags.length > 0) {
      return res.status(400).json({
        success: false,
        message: `以下标签不存在：${unknownTags.join(', ')}`
      });
    }

    // 开始事务
    db.beginTransaction(err => {
      if (err) {
        console.error('开启事务失败:', err);
        return res.status(500).json({ success: false, message: '事务开启失败' });
      }

      // 删除旧标签绑定
      const deleteQuery = 'DELETE FROM file_tags WHERE file_id = ?';
      db.query(deleteQuery, [id], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('删除旧标签失败:', err);
            res.status(500).json({ success: false, message: '删除旧标签失败' });
          });
        }

        // 插入新标签绑定
        const insertQuery = 'INSERT INTO file_tags (file_id, tag_id) VALUES ?';
        const values = tags.map(tag => [id, tagIdMap[tag]]);

        db.query(insertQuery, [values], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('插入新标签失败:', err);
              res.status(500).json({ success: false, message: '插入标签失败' });
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('提交事务失败:', err);
                res.status(500).json({ success: false, message: '事务提交失败' });
              });
            }

            res.json({ success: true, message: '标签更新成功' });
          });
        });
      });
    });
  });
});


// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});