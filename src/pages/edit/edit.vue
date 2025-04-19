<template>
    <div ref="overlay" id="overlay"></div>
    <div id="editPage" v-if="!isOnUpload">
        <audio ref="audioplayer" @timeupdate="progressLine"></audio>
        <div>
            <button @click="filebrower">点我浏览本地文件</button>
        </div>
        <div>当前文件为:{{ audioNameText }}</div>
        <div>
            <button @click="save">点我保存文件</button>
        </div>
        <div ref="errortip" id="errortip">{{ tip }}</div>
        <div class="editTool">
            <div>
                <button id="playPauseButton" @click="playPauseButton">{{playPauseButtonText}}</button>
            </div>
            <div>
                <button id="montageButton" @click="montageButton">裁剪</button>
            </div>
            <div>
                <button id="fadeButton" @click="fadeButton">淡入淡出</button>
            </div>
            <button  id="uploadBtn" @click="uploadBtn">
                <img id="uploadBtnImg" src="/upload.png">
            </button>
            <span id="start-time">{{temp_1}}</span>
                <div class="editControl" ref="editControl">
                    <div ref="startdragbutton" 
                        id="start-dragbutton"
                        @mousedown="onMouseDown('start')"
                    ></div>
                    <div ref="enddragbutton" 
                        id="end-dragbutton"
                        @mousedown="onMouseDown('end')"
                    ></div>
                    <div ref="editContainer"class="edit-container">
                        <div ref="editbar" id="editbar"></div>
                        <div ref="progressline" id="progressline"></div>
                    </div>
                </div>
            <span id="end-time">{{temp_2}}</span>
        </div>
    </div>
    <div class="upload" v-else>
        
        <div class="audiodata">
            <div class="audio-info-item">
                <div class="InfoHead">文件名:</div>
                <div>{{ audioNameText }}</div>
            </div>
            <div class="audio-info-item">
                <div class="InfoHead">文件格式:</div>
                <div>{{ codecInfo }}</div>
            </div>
            <div class="audio-info-item">
                <div class="InfoHead">文件大小:</div>
                <div>{{ sizeInfo }} MB</div>
            </div>
            <div class="audio-info-item">
                <div class="InfoHead">音频时长:</div>
                <div>{{ duratimeInfo }}</div>
            </div>
            <div class="audio-info-item">
                <div class="InfoHead">音轨数量:</div>
                <div>{{ channelsInfo }}</div>
            </div>
            <div class="audio-info-item">
                <div class="InfoHead">比特率:</div>
                <div>{{ bitrateInfo }} kbps</div>
            </div>
            <div class="audio-info-item">
                <div class="InfoHead">采样率:</div>
                <div>{{ samplerateInfo }}</div>
            </div>
            
        </div>
        <div class="fileInfo">
            <div>
                <audio ref="uploadplayer"></audio>
            </div>
            <div class="control">
                <label for="audionmae" class="lable">文件名:</label>
                <input class="inputclass" type="text" v-model="audioname" placeholder="请输入音频名称"/>
            </div>
            <div>
                文件预览<button id="preview" @click="preview">{{previewText}}</button> 
            </div>
            <div class="control">
                <label for="private" class="lable">是否私有:</label>
                <select class="selectclass" v-model="isPrivate" name="private">
                    <option value="1">是</option>
                    <option value="0">否</option>
                </select>
            </div>
        </div>
        <div class="tagselector">
            <div class="selectedtags">
                <div id="selectedTagsHead">已选标签:</div>
                <div v-for="tag in selectedTags" :key="tag" class="tag">
                {{ tag }}
                </div>
            </div>
            <div class="selectTags">
                <button
                    class="selectBtn"
                    v-for="tag in allTags"
                    :key="tag"
                    :class="{'selected': selectedTags.includes(tag)}"
                    @click="toggleTag(tag)"
                >
                {{ tag }}
                </button>
            </div>
        </div>
        <div>
            <button id="confirmuploadBtn" @click="confirmuploadBtn">确认上传</button>
            <button id="cancleuploadBtn" @click="cancleuploadBtn">取消上传</button>
        </div>

    </div>
    
</template>

<script setup>

import { watch, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';

const route = useRoute();

const temp_1 = ref("0:00:000");
//该变量用于显示音频的开始时间
const temp_2 = ref("0:00:000");
//该变量用于显示音频的结束时间

let filemessage = null;
let filename = null;
let startrect;
let endrect;
let starttime;
let endtime;
let duratime;
let audioInfo;
const bitrateInfo = ref(" ");
const duratimeInfo = ref(" ");
const samplerateInfo = ref(" ");
const channelsInfo = ref(" ");
const codecInfo = ref(" ");
const sizeInfo = ref(" ");
const isPageOperable = ref(true);
const isFileSaved = ref(false);
const overlay = ref(null);
const audioNameText = ref("空");
const audioplayer = ref(null);
const progressline = ref(null);
const editContainer = ref(null);
const playPauseButtonText = ref("播放");
const dragmark = ref(false);
//该变量用于判断是否正在拖拽编辑控件
const tip = ref(" ");
const startdragbutton = ref(null);
const enddragbutton = ref(null);
const dragging = ref(null);
const editbar =ref(null);
const editControl = ref(null);
const isOnUpload = ref(null);
const allTags = ref(['自然', '科技', '机械', '人声', '噪音', '交互', '战斗', '过场', '搞笑']);
const selectedTags = ref([]);
const audioname = ref("");
const isPrivate = ref("");
const uploadplayer = ref(null);
const previewText = ref("播放");
//该变量是上传的预览播放按钮的文案

const filebrower = async()=>{
    isFileSaved.value = true;
    isPageOperable.value = false;
    //核心函数，异步函数
    filemessage = await fileAPI.selectFile();
    if(filemessage.message == 'E00'){
        isFileSaved.value = false;
        isPageOperable.value = true;
        return;
    }
    //调用预加载脚本的fileAPI里的selectFile方法,并把选中的文件复制到指定文件夹里等待操作
    filename = await fileAPI.getFileName(filemessage.destPath);  
    //调用预加载脚本的fileAPI里的getFileName方法，传入audioFiles，并将返回值传入audioname
    //audioname用于承接从方法中传过来的所有音频文件名称   
    audioNameText.value = filename[0];
    isPageOperable.value = true;
    audioplayer.value.src=`local://0/${filemessage.destPath[0]}`;
}

const save = async()=>{
    if(!isFileSaved.value){
        return;
    }
    isPageOperable.value = false;
    const savePath = await fileAPI.selectFolder();
    const savemessage = await fileAPI.saveFile(filename[0], savePath, filemessage.destPath[0]);
    if(!savemessage.success){
        console.log('文件保存失败');
        isPageOperable.value = true;
        return;
    }else{
        const deletemessage = await fileAPI.deleteFile(filemessage.destPath[0]);
        if(!deletemessage.success){
            console.log('文件保存失败');
            isPageOperable.value = true;
            return;
        }else{
            isFileSaved.value = false;
            audioNameText.value = '空';
            isPageOperable.value = true;
            filemessage = null;
            return;
        }
    }

}

function progressLine() {
    const percent = audioplayer.value.currentTime/audioplayer.value.duration;
    temp_1.value = time(audioplayer.value.currentTime);
    temp_2.value = time(audioplayer.value.duration);
    progressline.value.style.left = `${(editContainer.value.getBoundingClientRect().width)*((percent))}px`;
}

function time(time){
        if (isNaN(time) || time === null || time === undefined) {
                return "0:00:000";
            }//如果时间计算异常，则返回0:00:000
        const minutes = Math.floor(time/60);
        const seconds = Math.floor(time%60); 
        const millisecond = Math.floor(((time%60)%1)*1000); 
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}:${millisecond < 100 ? "0" : ""}${millisecond < 10 ? "0" : ""}${millisecond}`;
    }

function playPauseButton(){
    if(filemessage === null){
        return;
    }
    if(audioplayer.value.paused){
            audioplayer.value.play();
            previewText.value = "暂停";
        }else {
            audioplayer.value.pause();
            previewText.value = "播放";
        }
}


function onMouseDown(type){
    startdragbutton.value.style.cursor = 'pointer';
    enddragbutton.value.style.cursor = 'pointer';
    dragging.value = type;
    if(filemessage==undefined){
        return;
    }
    //如果播放列表为空，则不能通过拖拽来控制进度条
    dragmark.value=true;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e){
    if(dragmark.value){
        const editControlRect = editControl.value.getBoundingClientRect();
        const editContainerRect = editContainer.value.getBoundingClientRect();
        const startRect = startdragbutton.value.getBoundingClientRect();
        const endRect = enddragbutton.value.getBoundingClientRect();
        if (dragging.value === "start") {
            const percent = Math.max(0, Math.min( (e.clientX - editControlRect.left)/editControlRect.width, (endRect.left - editControlRect.left - 6)/editControlRect.width ));
            startdragbutton.value.style.left = `${percent*100}%`;
            const leftside = ((startRect.left + 3 - editContainerRect.left) / editContainerRect.width);
            editbar.value.style.left = `${leftside*100}%`;
            starttime = audioplayer.value.duration*percent;
            temp_1.value = time(starttime);
                
        } else if (dragging.value === "end") {
            const percent = Math.max(0, Math.min( (editControlRect.width - (e.clientX - editControlRect.left))/editControlRect.width, (editControlRect.width - (startRect.left - editControlRect.left + 12))/editControlRect.width ));
            enddragbutton.value.style.right = `${percent*100}%`;
            const rightside = ((editContainerRect.width - (endRect.left + 3 - editContainerRect.left)) / editContainerRect.width);
            editbar.value.style.right = `${rightside*100}%`;
            endtime = audioplayer.value.duration*(1-percent);
            temp_2.value = time(endtime);
            duratime = audioplayer.value.duration - endtime;
        }
    }
}

function preview(){
    if(uploadplayer.value.paused){
        uploadplayer.value.play();
        previewText.value = "暂停"
    }else {
        uploadplayer.value.pause();
        previewText.value = "播放"
    }
         
}

function onMouseUp(){
    if(dragmark.value){
        startdragbutton.value.style.cursor = 'dedault';
        enddragbutton.value.style.cursor = 'dedault';
        window.removeEventListener('mousemove',onMouseMove);
        window.removeEventListener('mouseup',onMouseUp);
        dragmark.value=false;
    }
}

const uploadBtn = async() => {
    filemessage = await fileAPI.selectFile();
    
    isOnUpload.value = true;
    if(filemessage.message == 'E00'){
        isOnUpload.value = false;
        return;
    }

    audioname.value = null;
    isPrivate.value = null;
    selectedTags.value = [];
    
    audioInfo = await ffmpegAPI.getInfo(filemessage.destPath[0]);
    filename = await fileAPI.getFileName(filemessage.destPath);
    audioNameText.value = filename[0];
    bitrateInfo.value = audioInfo.bitRate;
    duratimeInfo.value = time(audioInfo.duration);
    samplerateInfo.value = audioInfo.sampleRate;
    channelsInfo.value = audioInfo.channels;
    codecInfo.value = audioInfo.codec;
    sizeInfo.value = Math.floor(((audioInfo.size/1024)/1024)*100)/100;
    uploadplayer.value.src = `local://0/${filemessage.destPath[0]}`;
}

onBeforeRouteLeave((to, from, next) => {
    if(!isFileSaved.value){
        next();
        return;
    }
    const answer = window.confirm('需要保存文件吗')
    if (answer){
        save().then(() => {
        next(); // 保存完成后继续路由跳转
        }).catch((error) => {
        console.error('保存文件失败:', error);
        next(false); // 保存失败，阻止路由跳转
        });
    }else{
        (async () => {
            try {
                const deletemessage = await fileAPI.deleteFile(filemessage.destPath[0]);
                if (!deletemessage.success) {
                    console.log('文件删除失败');
                } else {
                    audioNameText.value = '空';
                }
                isFileSaved.value = false;
                next(); // 删除操作完成后继续路由跳转
            } catch (error) {
                    console.log('删除文件错误:', error);
                    next(false);
                }
            })();
        }
})

const confirmuploadBtn = async() => {
    const username = localStorage.getItem("userName");
    const userid = localStorage.getItem("userId");
    const fileInfo = {
        audioname: audioname.value,
        username: username,
        userid: userid,
        size: audioInfo.size,
        codec: audioInfo.codec,
        duratime: audioInfo.duration,
        bitrate: audioInfo.bitRate,
        samplerate: audioInfo.sampleRate,
        channels: audioInfo.channels,
        tag: selectedTags.value.map(tag => (typeof tag === "object" ? { ...tag } : tag)),
        private: isPrivate.value
    }
    console.log(fileInfo);
    
    const response = await uploadAPI.uploadAudio(filemessage.destPath[0],fileInfo);
    if(response.success){
        await fileAPI.deleteFile(filemessage.destPath[0]);
        isOnUpload.value = false;
    }
    
}

function cancleuploadBtn(){
    isOnUpload.value = false;
}

watch(isPageOperable,(newvalue)=>{
    //检测是否在进行文件操作，进行文件操作时，不能操作页面
    if(newvalue){
        overlay.value.style.display = 'none';
    }else{
        overlay.value.style.display = 'flex';
    }
})

onMounted(() => {
    startrect =startdragbutton.value.getBoundingClientRect();
    endrect =enddragbutton.value.getBoundingClientRect();
});

const montageButton = async()=> {
    if(!isFileSaved.value){
        return;
    }
    isPageOperable.value = false;
    filemessage = await ffmpegAPI.cutAudio(filemessage.destPath,starttime,endtime)
    startdragbutton.value.style.left = '0%';
    enddragbutton.value.style.right = `0%`;
    editbar.value.style.left = '0%';
    editbar.value.style.right = '0%';
    progressline.value.style.left = '0px';
    if(filemessage.message === '01'){
        audioplayer.value.src = `local://0/${filemessage.destPath[0]}`;
        isPageOperable.value = true;
        return;
    }else{
        isPageOperable.value = true;
        return;
    }
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else if (selectedTags.value.length < 5) {
    selectedTags.value.push(tag);
  }
};

const fadeButton = async()=> {
    if(!isFileSaved.value){
        return;
    }
    isPageOperable.value = false;
    
    filemessage = await ffmpegAPI.fadeIO(filemessage.destPath,starttime,endtime,duratime);
    startdragbutton.value.style.left = '0%';
    enddragbutton.value.style.right = `0%`;
    editbar.value.style.left = '0%';
    editbar.value.style.right = '0%';
    progressline.value.style.left = '0px';
    if(filemessage.message === '01'){
        audioplayer.value.src = `local://0/${filemessage.destPath[0]}`;
        isPageOperable.value = true;
        return;
    }else{
        isPageOperable.value = true;
        return;
    }
}

</script>

<style scoped>
    .editTool{
        user-select: none;
        position: fixed;
        width: 100%;
        height: 150px;
        bottom: 80px;
        left: 180px;
        right: 0px;
    }

    .editControl{
        position: absolute;
        width: auto;
        height: 36px;
        left: 130px;
        right: 310px;
        bottom: 80px;
    }

    .edit-container{
        position: absolute;
        left: 3px;
        right: 3px;
        height: 30px;
        width: auto;
        top: 3px;
        background-color: rgb(45, 45, 45);
    }
    #editbar{
        position: absolute;
        background-color: rgb(179, 179, 179);
        height: 100%;
        width: auto;
        left: 0%;
        right: 0%;
    }
    
    #start-time{
        position: absolute;
        left: 50px;
        bottom: 88px;
    }

    #end-time{
        position: absolute;
        right: 230px;
        bottom: 88px;
    }
   
    #start-dragbutton{
        z-index: 999;
        position: absolute;
        width: 4px;
        height: 34px;
        bottom: 0px;
        left: 0%;
        border:1px solid #000000;
        border-radius: 3px;
        background-color: #FFFFFF;
        opacity: 100%;
   }

   #end-dragbutton{
        z-index: 999;
        position: absolute;
        width: 4px;
        height: 34px;
        bottom: 0px;
        right: 0%;
        border:1px solid #000000;
        border-radius: 3px;
        background-color: #FFFFFF;
        opacity: 100%;
   }

   #progressline{
        position: absolute;
        width: 1px;
        height: 30px;
        bottom: 0px;
        left: 0px;
        background-color: #ff0000;
   }

   #playPauseButton{
    position: relative;
    top: 5px;
    left: 130px;
   }

#start-dragbutton:hover {
    cursor: pointer;
    background-color: #636363;
}

#end-dragbutton:hover {
    cursor: pointer;
    background-color: #636363;
}

#overlay{
    z-index: 9999;
    display: none;
    position: fixed;
    background-color: #a1a1a1;
    width: 100%;
    height: 100%;
    bottom: 80px;
    opacity: 70%;
}

#uploadBtn{
    z-index: 9999;
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    right: 280px;
    bottom: 130px;
    height: 70px;
    width: 70px;
    border: none;
    background-color: #40bff1;
    border-radius: 35px;

    }

#uploadBtnImg{
    position: relative;
    height: 35px;
    width: 35px;
}

#uploadBtn:hover{
    box-shadow: 0px 0px 5px #2a2a2a6a;
}

.audiodata {
    display: flex;
    flex-direction: column;
    margin: 15px;
    padding: 20px;
    border-radius: 10px;
    font-size: 16px;
    background-color: #4d5c7b58;
}

.InfoHead{ 
    
    width: 80px;
    font-weight: bold;
}

.audio-info-item{
    display: flex;
    align-items: center;
}

.fileInfo{
    margin: 15px;
    display: flex;
    flex-direction: column;
}

.inputclass{
    height: 35px;
    border-radius: 5px;
    background-color: #1c23355a;
    border: none;
}

.inputclass:focus{
    outline: none;
    background-color: #10141e61;
}

.inputclass::placeholder {
    
    color: #000000c7; 
    
}

.selectclass{
    margin-top: 10px;
    width: 50px;
    height: 35px;
    border-radius: 5px;
    background-color: #1c23355a;
    border: none;
}

.tagselector{
    margin: 15px;
}

#selectedTagsHead{
    
    width: 80px;
}

.selectedtags{
    display: flex;
    flex-direction: row;
    height: 30px;
}

.selectTags{
    height: 100px;
    padding: 20px;
    border-radius: 10px;
    background-color: #3e46584e;
}

.selectBtn{
    margin-right: 10px;
    height: 27px;
    width: 45px;
    background-color: #33445324;
    border: 1px solid #000000;
    border-radius: 5px;
    font-size: 15px;
    text-align: center;
}

.tag{
    padding-top: 1px;
    margin-right: 10px;
    height: 24px;
    width: 43px;
    background-color: #33445324;
    border: 1px solid #000000;
    border-radius: 5px;
    font-size: 15px;
    text-align: center;
}

.selectBtn.selected{
    border: 1px solid #a4e6fe;
    color: #a4e6fe;
}
</style>