const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const { exec } = require('child_process');
const { log } = require('console');
const path = require('path');
const { PassThrough } = require('stream');
const fs = require('fs');
const fsp = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const { Blob } = require('buffer');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const isDev = process.env.NODE_ENV === 'development';

function createWindow(){
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth:800,
    minHeight:600,
    maxWidth:1400,
    maxHeight:1000,
    autoHideMenuBar:true,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      preload:path.resolve(__dirname,'./preload.js')
      
    }
  });

  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobeStatic.path);


  ipcMain.handle('selectfolder',async()=>{
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });
    if(result.canceled){
      return null;
    }else {
      return result.filePaths[0];
    }
  })

  ipcMain.handle('readfolder',async(_,folderPath)=>{
    const files=fs.readdirSync(folderPath);
    const audioFiles=[];
    for(const file of files){
      const ext = path.extname(file).toLowerCase();
      if(['.mp3','.wav','.m4a','.flac','.ogg'].includes(ext)){
        audioFiles.push(path.join(folderPath,file));
      }
    }
      return audioFiles;
  })

  ipcMain.handle('selectfile',async()=>{
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3','wav','flac','ogg'] }
      ]
    });
    if(result.canceled){
      return ({success: false, message: 'E00'});
    }
      const selectedFilePath = result.filePaths[0];
      //result.filePaths的本质是数组
      const fileName = path.basename(selectedFilePath);
      const editPath = path.join(__dirname, '../../audio_edit');
      const destPath = [path.join(editPath, fileName)];

      const readStream = fs.createReadStream(selectedFilePath);
      const writeStream = fs.createWriteStream(destPath[0]);
  
      return new Promise((resolve, reject) => {
        readStream.on('error', (err) => {
            console.error('文件读取错误:', err);
            reject({success: false, message: 'E01', error: err});
        });
        writeStream.on('error', (err) => {
            console.error('文件写入错误:', err);
            reject({success: false, message: 'E02', error: err});
        });
        writeStream.on('finish', () => {
            resolve({success: true,message: '01', destPath}); 
        });
        // 连接流
        readStream.pipe(writeStream);
    });
      
  })

  ipcMain.handle('getname',async(_,audioFiles)=>{
    const audioName=[];
    for(const filename of audioFiles){
      const name = path.basename(filename);
      audioName.push(path.join(name))
    }
    return audioName;
  })

  ipcMain.handle('savefile',async(_, filename, savePath, filePath)=>{
    const saveFilePath = path.join(savePath, filename);
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(saveFilePath);
    return new Promise((resolve, reject) => {
      readStream.on('error', (err) => {
          console.error('文件读取错误:', err);
          reject({success: false, message: 'E01', error: err});
      });
      writeStream.on('error', (err) => {
          console.error('文件写入错误:', err);
          reject({success: false, message: 'E02', error: err});
      });
      writeStream.on('finish', () => {
        console.error('文件保存成功');
        resolve({success: true, message: '01'});
      });

      // 连接流
      readStream.pipe(writeStream);
    });
  })

  ipcMain.handle('deletefile',async(_, filePath)=>{
    console.log('通过 IPC 触发删除:', filePath);
    return deleteDirectoryFiles(filePath);
  })

  const deleteDirectoryFiles = async (filePath) => {
    return new Promise((resolve, reject) => {
      const directoryPath = path.dirname(filePath);
      fs.promises.readdir(directoryPath)
      .then(files => {
          const deletePromises = files.map(async file => {
              const fileToDelete = path.join(directoryPath, file);
              const stat = await fs.promises.stat(fileToDelete);
            if (stat.isFile()) {
              return fs.promises.unlink(fileToDelete).then(() => {
                console.log(`已删除: ${fileToDelete}`);
              });
            }
          });

          return Promise.all(deletePromises);
      })
      .then(() => {
          console.log('文件夹清理完成');
          resolve({ success: true, message: '01' });
      })
      .catch(error => {
          console.error('删除文件失败:', error);
          reject({ success: false, message: '00', error });
      });
    });
  }

  ipcMain.handle('cutaudio',async(_,filePath, starttime, endtime)=>{
    const tempFilePath = [filePath[0].replace(/(\.\w+)$/, "_temp$1")];
    return new Promise((resolve, reject) => {
      ffmpeg(filePath[0])
        .setStartTime(starttime)
        .setDuration((endtime - starttime).toFixed(3))
        .output(tempFilePath[0])
        .on("end", () => {
            resolve({success: true, message: '01',destPath: tempFilePath});
        })
        .on("error", (err) => {
            console.error("音频剪辑失败:", err.message);
            reject({success: false, message: '00', error: err});
        })
        .run();
    })
  })

  ipcMain.handle('fadeio',async(_, filePath, starttime, endtime, duratime)=>{
    // console.log(duratime);
    // console.log(endtime);
    const tempFilePath = [filePath[0].replace(/(\.\w+)$/, "_temp$1")];
    return new Promise((resolve, reject) => {
      console.log('开始处理');
      ffmpeg(filePath[0])
        .audioFilters([
            `afade=t=in:ss=0:d=${starttime}`, // 淡入效果
            `afade=t=out:st=${endtime}:d=${duratime}` // 淡出效果，持续到音频结束
        ])
        .output(tempFilePath[0])
        .on('end', function() {
          console.log('音频处理成功');
          resolve({success: true, message: '01',destPath: tempFilePath});
        })
        .on('error', function(err) {
          console.log('音频处理错误');
          reject({success: false, message: '00', error: err});
        })
        .run();
    })
  })

  ipcMain.handle('getinfo',async(_, filePath)=>{
    return new Promise((resolve,reject)=>{
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject('获取音频信息失败: ' + err);
        } else { fs.stat(filePath, (err, stats) => {
          if (err) {
            reject({ success: false, message: 'E04', error: err });
          } else {
            let size = stats.size;
            let codec = metadata.streams[0].codec_name;
            let duration = metadata.format.duration;
            let sampleRate = metadata.streams[0].sample_rate;
            let channels = metadata.streams[0].channels;
            let bitRate;
            
            if( codec === 'wav'){
              const bitDepth = metadata.streams[0].bits_per_sample;
              bitRate = sampleRate*bitDepth*channels;
            }else{
              bitRate = Math.floor(((size*8)/duration)/1000);
            }
            
              const info = {
                duration: duration,
                bitRate: bitRate,
                sampleRate: sampleRate,
                channels: channels,
                codec: codec,
                size: size
              };
              resolve(info);
            }
          })
        }
      });
    });
  })

  const convertToSafeMp3 = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libmp3lame')
        .audioBitrate(192)
        .outputOptions([
          '-f mp3',
          '-write_xing 0',
          '-map_metadata 0',       // 保留输入元数据
          '-id3v2_version 3',      // 强制 ID3v2.3
          '-write_id3v2 1'         // 确保生成标签
        ])
        .on('error', (err) => {
          console.error('FFmpeg 转码失败:', err);
          reject(new Error('FFmpeg 转码失败'));
        })
        .on('end', () => {         // 使用 FFmpeg 原生结束事件
          try {
            // 校验文件头
            const header = Buffer.alloc(4);
            const fd = fs.openSync(outputPath, 'r');
            fs.readSync(fd, header, 0, 4, 0);
            fs.closeSync(fd);
            const hasID3 = header.slice(0, 3).toString() === 'ID3';
            const hasAudioFrame = header[0] === 0xFF && (header[1] & 0xE0) === 0xE0;
            if (!hasID3 && !hasAudioFrame) {
              fs.unlinkSync(outputPath);
              reject(new Error('转码失败：文件既无ID3标签，也缺少有效音频帧'));
              return;
            }
            // 校验文件大小
            const stats = fs.statSync(outputPath);
            if (stats.size < 2048) {
              fs.unlinkSync(outputPath);
              reject(new Error('生成的 MP3 文件太小，可能损坏'));
            } else {
              resolve();
            }
          } catch (err) {
            reject(new Error(`文件校验失败: ${err.message}`));
          }
        })
        .save(outputPath); // 关键修改：直接保存文件，而非流式写入
    });
  };
  
  // 主逻辑封装
  ipcMain.handle('uploadaudio', async (_, filepath, fileinfo) => {
    const userid = 100000 + Number(fileinfo.userid);
    const fileName = `${Date.now()}_${userid}.mp3`;
    const tempDir = path.resolve(__dirname, '../../temp');
    const tempPath = path.join(tempDir, 'temp.mp3');
    try {
      // 转码音频并修复元数据
      await convertToSafeMp3(filepath, tempPath);
      // 读取文件头并兼容两种校验逻辑
      const header = Buffer.alloc(4);
      const fd = fs.openSync(tempPath, 'r');
      fs.readSync(fd, header, 0, 4, 0);
      fs.closeSync(fd);
      const hasID3 = header.slice(0, 3).toString() === 'ID3';
      const hasAudioFrame = header[0] === 0xFF && (header[1] & 0xE0) === 0xE0;
      if (!hasID3 && !hasAudioFrame) {
        throw new Error('转码后文件既无ID3标签，也缺少有效音频帧');
      }
      // 创建 FormData 并上传
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(tempPath);
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'audio/mpeg'
      });
      formData.append('fileInfo', JSON.stringify(fileinfo));
      const response = await axios.post('http://127.0.0.1:3000/upload/audio', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        },
        timeout: 60000
      });
      fs.unlinkSync(tempPath);
      return response.data;
    } catch (error) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw new Error(`上传失败：${error.message}`);
    }
  });
  

ipcMain.handle('selectimage',async()=>{
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Image', extensions: ['jpg','jpeg','png'] }
    ]
  });
  if(result.canceled){
    return ({success: false, message: 'E00'});
  }
    const selectedFilePath = result.filePaths[0];
    //result.filePaths的本质是数组
    const fileName = path.basename(selectedFilePath);
    const editPath = path.join(__dirname, '../../public/avatar_folder');
    const destPath = [path.join(editPath, fileName)];

    const readStream = fs.createReadStream(selectedFilePath);
    const writeStream = fs.createWriteStream(destPath[0]);

    return new Promise((resolve, reject) => {
      readStream.on('error', (err) => {
          console.error('文件读取错误:', err);
          reject({success: false, message: 'E01', error: err});
      });
      writeStream.on('error', (err) => {
          console.error('文件写入错误:', err);
          reject({success: false, message: 'E02', error: err});
      });
      writeStream.on('finish', () => {
          resolve({success: true,message: '01', destPath}); 
      });
      // 连接流
      readStream.pipe(writeStream);
  });
})

ipcMain.handle('updateimage',async(_,uint8Array, imagepath, userid)=>{
  const ext = path.extname(imagepath);
  // console.log(uint8Array);
  // console.log(imagepath);
  // console.log(userid);
  

  const formData = new FormData();
  const user_id = 100000 + Number(userid);
  const imagename = `${Date.now()}_${user_id}${ext}`;
  const buffer = Buffer.from(uint8Array); // 将 Uint8Array 转换回 Buffer
  //console.log(buffer);
  const imagemd5 = crypto.createHash('md5').update(buffer).digest('hex');
  formData.append('file', buffer, imagename);
  formData.append('md5',imagemd5);
  formData.append('userid',userid);
  
  try {
    console.log('准备发送请求...');
    const response = await axios.post('http://127.0.0.1:3000/upload/image', formData, {
      headers: {
          ...formData.getHeaders(),//这个api，来自server.js 
      },
      timeout: 60000 
    });

    console.log(response.data);
    
    return response.data;

  } catch (error) {
    console.error("保存图片时出错:", error);
    return { success: false, message: "保存失败", error };
  }
  
})

async function downloadHeadshot(userid) {
  const imagefolder = path.join(__dirname, '../../public/avatar_folder')
  try {
    const infourl = `http://127.0.0.1:3000/getheadshotinfo`;
    const fileurl = `http://127.0.0.1:3000/getheadshot/${userid}`;
    
    const filemessage = await fetch(infourl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userid: userid }),
    });

    data = await filemessage.json();
    console.log(data.value);
    
    if(!data.value){
      return;
    }
    
    const response = await axios.get(fileurl, { responseType: 'stream' });

    
      
    const imagePath = path.join(imagefolder, data.filename);
    
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);
      writer.on('finish', () => resolve(imagePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('下载头像失败:', error);
    throw new Error('下载头像失败');
  }
}

ipcMain.handle('checkfile',async(_,userid)=>{
  try {
    const imagepath = path.join(__dirname, '../../public/avatar_folder')
    const files = await fsp.readdir(imagepath,{ withFileTypes: true });
    console.log(files.length);
    
    if (files.length === 0) {
      return await downloadHeadshot(userid);
    }
    
    if (files.length === 1) {
      const filePath = path.join(imagepath, files[0].name);
      const fileBuffer = await fsp.readFile(filePath);
      const localMd5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
      
      const response = await fetch(`http://127.0.0.1:3000/checkheadshotmd5`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userid: userid }), 
      });
      data = await response.json();
      //console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!',data);
      if(!data.value){
        
        await deleteDirectoryFiles(filePath);
        return;
      }
      

      if (localMd5 !== data.message) {
        await deleteDirectoryFiles(filePath);
        return await downloadHeadshot(userid);
      }
      return filePath;
    }
    
    if (files.length > 1) {
      const filePath = path.join(imagepath, files[0].name);
      await deleteDirectoryFiles(filePath);
      return await downloadHeadshot(userid);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // 目录不存在
    }
    console.error('检查文件时出错:', error);
    return false;
  }
})

   
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
}

 protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
]);



app.whenReady().then(() => {
  createWindow()
  // 处理协议请求
  protocol.registerFileProtocol('local', (request, callback) => {
    const filePath = request.url.substr(16); // 移除 "local://"
    callback(decodeURI(path.normalize(filePath)))
  });
});

