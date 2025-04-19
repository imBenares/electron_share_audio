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