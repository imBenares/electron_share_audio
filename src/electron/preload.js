const { contextBridge,ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('getFormat',{
    getOsFormat(){
       return ipcRenderer.invoke('get')
    }
})

contextBridge.exposeInMainWorld('fileAPI',{
    //定义fileAPI，用于定义filebrowser的渲染进程的信道
    selectFolder(){
        return ipcRenderer.invoke('selectfolder');
    },
    selectFile(){
        return ipcRenderer.invoke('selectfile');
    },
    saveFile( filename, savePath, filePath ){
        return ipcRenderer.invoke('savefile', filename, savePath, filePath);
    },
    deleteFile( filePath ){
        return ipcRenderer.invoke('deletefile', filePath);
    },
    readFolder( folderPath ){
        return ipcRenderer.invoke('readfolder',folderPath);
    },
    getFileName( audioFiles ){
        return ipcRenderer.invoke('getname',audioFiles);
    },
    getFile( filepath ){
        return ipcRenderer.invoke('getfile',filepath);
    },
    selectImage(){
        return ipcRenderer.invoke('selectimage');
    },   
    updateImage(uint8Array, imagepath, userid){
        return ipcRenderer.invoke('updateimage',uint8Array, imagepath, userid);
    },
    checkFile(userid){
        return ipcRenderer.invoke('checkfile', userid);
    }
})

contextBridge.exposeInMainWorld('ffmpegAPI',{   
    cutAudio(filePath,starttime,endtime){
        return ipcRenderer.invoke('cutaudio',filePath,starttime,endtime);
    },
    fadeIO(filePath,starttime,endtime,duratime){
        return ipcRenderer.invoke('fadeio', filePath, starttime, endtime, duratime);
    },
    getInfo(filePath){
        return ipcRenderer.invoke('getinfo', filePath);
    }
}) 

contextBridge.exposeInMainWorld('uploadAPI',{   
    uploadAudio(filepath, fileinfo){
        return ipcRenderer.invoke('uploadaudio', filepath, fileinfo);
    },
    downloadAudio( audiopath, id, filename ){
        return ipcRenderer.invoke('downloadaudio', audiopath, id, filename );
    }
}) 
