<script>
app.post('/upload/audio', uploadAudio.single('file'), async (req, res) => {
  try {
    const filepath = `D:/audio_file_base/${req.file.filename}`;
    //获取文件在服务器上的存储位置
    const fileInfo = JSON.parse(req.body.fileInfo);
    //获取从主进程发送来的文件信息
    const tags = fileInfo.tag;
    //提取文件信息里的tag数据
    const placeholders = tags.map(() => '?').join(',');
    const query = `SELECT id FROM tag_id WHERE tag IN (${placeholders})`;
    
    db.query(query, tags, (err, results) => {
      if (err) {
        console.error("error:", err);
        return res.status(500).json({ error: "数据库查询错误" });
      }
      if(results.length > 0){
        const tagIds = results.map(row => row.id);
        //console.log(results);
        //console.log('#####################',results);
        //console.log(fileInfo);
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
        const query = 'INSERT INTO audio_info (audio_name, user_name, user_id, size, duratime, bitrate, samplerate, channels, private, upload_time, audiopath, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)';
        db.query(query,[audioname, username, userid, size,  duratime, bitrate, samplerate, channels, private, filepath, 0],(err, results) => {
          if(results){
            const file_id = results.insertId;
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
          if(err){
            console.log("ERR:",err);
          }
        })
      }
    
    })
  }catch(err){
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database query failed" });
  }

  
});
</script>

<!-- const { username, password, gender, birthdate, email, tel } = req.body;

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
    const [infoResult] = await db.promise().query("INSERT INTO user_information (user_id, id, username, gender, birthdate, email, tel, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [userId, userId, username, gender, birthdate, email, tel, 0]);
    console.log('插入 user_information 表成功, info_result:', infoResult);

    // 提交事务
    await db.promise().commit();
    console.log('事务提交成功');
    return res.json({ success: true });

  } catch (error) {
    console.error('发生错误:', error);
    await db.promise().rollback(); // 回滚事务
    return res.json({ message: "用户注册失败", error: error.message });
  } -->