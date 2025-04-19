<template>
    <div ref="audioplayer" class="audioplayer">
            <audio ref="audioPlayer" @timeupdate="timeView" @ended="onended"></audio>
            <div id="playButton">
                <button id="playStopButton" @click="playStopButton">停止</button>
                <button id="playModeButton" @click="playModeButton">{{playModeButtonText}}</button>
            </div>
            <div class="toggleButton">
                <button id="lastMusicButton" @click="lastMusicButton">上一曲</button>
                <button id="playPauseButton" @click="playPauseButton">{{playPauseButtonText}}</button>
                <button id="nextMusicButton" @click="nextMusicButton">下一曲</button>
            </div>
            <div class="progress">
                <span id="current-time">{{temp_1}}</span>
                    <div class="playerControl" ref="playerControl" 
                            @click="onMouseClick"
                            @mousedown="onMouseDown"
                            @mouseover="onMouseOver"
                            @mouseout="onMouseOut">
                        <div 
                            ref="progressContainer"
                            class="progress-container"
                        >
                            <div ref="progressbar" id="progressbar"></div>
                            <div ref="dragbutton" id="dragbutton"></div>
                    </div>
                    </div>
                <span id="duration">{{temp_2}}</span>
            </div>
            <div id="audioName">当前播放：{{audioNameText}}</div>
    </div>
</template>


<script setup>
import { ref,watch } from "vue";
import { useFileStore,useFileName } from '@/store/usefilestore.js';
import { useRoute } from "vue-router";

const fileStore = useFileStore();
const fileName = useFileName();
const route = useRoute();



let currentTrackIndex = 0;
//该变量用于定位播放列表
let newcurrenttime = 0
//该变量用于接收由onmousemove函数计算出的新时间值
let audioFiles = [];
//该变量用于接收从其他组件中传来的音频文件地址数组
let audioname = [];
//该变量用于接收从其他组件中传来的音频文件名称
const loop = ref(true);
//该变量用于控制播放器的播放模式
const temp_1 = ref("0:00");
//该变量用于更新音频的播放时长
const temp_2 = ref("0:00");
//该变量用于更新音频文件的总时长
const dragmark = ref(false);
//该变量用于判断是否正在拖拽进度条
const audioPlayer = ref();
const audioplayer = ref(null);
//该变量用于获取音频播放器的DOM元素
const playPauseButtonText = ref("暂停");
const playModeButtonText = ref("单曲循环");
const audioNameText = ref("空");
const progressbar = ref(null);
//该变量用于获取进度条的DOM元素
const dragbutton = ref(null);
//该变量用于获取拖拽按钮的DOM元素
const progressContainer = ref(null);
//该变量用于获取进度条背景的DOM元素
const playerControl = ref(null);
//该变量用于获取播放控件的DOM元素




function updateAudioPlayer(){
         //该函数用于更新音频播放器
        if(audioFiles[currentTrackIndex]==undefined){
    //如果audioFiles[i]为undefined说明文件夹中没有音频文件，则会触发如下命令
            audioPlayer.value.pause();     
    //播放器停止播放   
            audioPlayer.value.currentTime = 0; 
    //播放器的进度条归零
            audioPlayer.src = ""
    //播放器的音频源清空
            audioFiles=null;
    //audioFiles的值清空
            currentTrackIndex=0;
    //列表定位变量归零
            alert('文件夹中没有音频文件');
    //弹出提示
            //currentTrackDisplay.innerText = `音频名称: 空`;
    //音频名称显示还原为空
            return;
    //关闭整个函数
        }
        console.log(audioFiles);
        
        if(audioFiles[currentTrackIndex].includes("http://")){
            console.log("###");
            audioPlayer.value.src=audioFiles[currentTrackIndex];
        }else{
            console.log("@@@");
            audioPlayer.value.src=`local://0/${audioFiles[currentTrackIndex]}`;
        }
        console.log(audioPlayer.value.src);
        
        //把音频地址数组通过自定义协议赋值给音频播放器
    
        audioNameText.value = `${audioname[currentTrackIndex]}`;
        //显示音频名称

        audioPlayer.value.loop = loop.value;
        //获取循环状态

        audioPlayer.value.play();
        //播放
}

watch(route, (newRoute) => {
  if (newRoute.path === '/mainpage/edit') {
    audioPlayer.value.pause();
    audioplayer.value.style.setProperty("pointer-events", "none");
    audioplayer.value.style.opacity = 0.5;
    audioNameText.value = '播放器不可用';
  }else{
    audioplayer.value.style.setProperty("pointer-events", "auto");
    audioplayer.value.style.opacity = 1;
    if(audioNameText.value === '播放器不可用'){
        audioNameText.value = '空';
    }
  }
});

watch (()=>fileStore.fileList,()=>{
    //console.log(fileStore.fileList);
    
    //当从其他组件传来文件地址数组的时候，给该变量赋值
    audioFiles = fileStore.fileList;
    //console.log(audioFiles);
},{deep:true});

watch(()=>fileName.nameList,()=>{
    //当从其他组件传来的文件名称的时候，给该变量赋值，并更新音频播放器
    audioname = fileName.nameList;
    
    updateAudioPlayer();
},{deep:true})

watch(()=>loop.value,()=>{
    //更新播放器的循环模式
        if(audioPlayer.value.loop==true){
            audioPlayer.value.loop=false;
        } else if(audioPlayer.value.loop==false){
            audioPlayer.value.loop=true;
        }
})

    function lastMusicButton(){
        //上一曲功能实现
        if(audioFiles[currentTrackIndex]!=undefined){
            if(audioFiles==null){
                return;
            }
            currentTrackIndex=(currentTrackIndex-1+audioFiles.length)%audioFiles.length;
            updateAudioPlayer();
        }
    }

    function playPauseButton(){
        //暂停按钮功能实现
        if(audioFiles[currentTrackIndex]!=undefined){
            if(audioPlayer.value.paused){
                audioPlayer.value.play();
                playPauseButtonText.value = "暂停"
            }else {
                audioPlayer.value.pause();
                playPauseButtonText.value = "播放"
            }
        }  
    }

    function nextMusicButton(){
        //下一曲按钮功能实现
        if(audioFiles[currentTrackIndex]!=undefined){
            if(audioFiles==null){
                return;
            }
            currentTrackIndex=(currentTrackIndex+1)%audioFiles.length;
            updateAudioPlayer();
        }
    }

    function playStopButton(){
        //停止按钮功能实现
        audioPlayer.value.pause(); 
        console.log(audioPlayer.value.currentTime);
        audioPlayer.value.currentTime = 0;
        console.log(audioPlayer.value.currentTime);
    }

    function playModeButton(){
        //播放模式按钮功能实现
        if(loop.value==true){
            playModeButtonText.value = "列表循环";
            loop.value=false;
        } else if(loop.value==false){
            playModeButtonText.value = "单曲循环";
            loop.value=true;
    }
    }

    function timeView(){
        //时间更新函数
         if(dragmark.value){
             return;
         }
         //当拖拽状态为真时，暂停由该函数更新时间
        const percent = (audioPlayer.value.currentTime/audioPlayer.value.duration)*100;
        temp_1.value = timeNum(audioPlayer.value.currentTime);
        temp_2.value = timeNum(audioPlayer.value.duration);
        progressbar.value.style.width = `${percent}%`;
        dragbutton.value.style.left = `${(progressContainer.value.getBoundingClientRect().width)*(percent/100)+195}px`;
        //console.log(dragbutton.value.style.left);
        
    }

    function timeNum(time){
        if (isNaN(time) || time === null || time === undefined) {
                return "0:00";
            }//如果时间计算异常，则返回0:00
        const minutes = Math.floor(time/60);
        const seconds = Math.floor(time%60); 
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    function onended(){
        if(audioPlayer.value.loop==false){
            nextMusicButton();
        }
        //如果当前音频播放完成时，循环状态为列表循环，则直接调用下一曲来切换音频
    }

    function onMouseOver(){
        //当鼠标位于播放控件上的时候，使控件发光
        dragbutton.value.style.visibility = '';
        dragbutton.value.style.boxShadow = '0px 0px 5px  #ffffff';
        playerControl.value.style.cursor = 'pointer';
        progressContainer.value.style.cursor = 'pointer';
        progressContainer.value.style.boxShadow = '0px 0px 5px  #ffffff';
    }

    function onMouseOut(){
        //当鼠标离开播放控件的时候，使控件熄灭
        dragbutton.value.style.visibility = 'hidden';
        progressContainer.value.style.cursor = 'default';
        progressContainer.value.style.boxShadow = '';
    }

    function onMouseClick(e){
        //点击进度条跳转
        if(audioFiles[currentTrackIndex]==undefined){
            return;
        }
        //如果播放列表为空，则不能通过点击来控制进度条
        const rect =playerControl.value.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newtime = (x/rect.width)*audioPlayer.value.duration;
        audioPlayer.value.currentTime = newtime;
    }

    function onMouseDown(){
        if(audioFiles[currentTrackIndex]==undefined){
            return;
        }
        //如果播放列表为空，则不能通过拖拽来控制进度条
        dragmark.value=true;
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }

    function onMouseMove(e){
        if(dragmark.value){
            dragbutton.value.style.visibility = '';
            //拖拽按钮可被显示
            dragbutton.value.style.boxShadow = '0px 0px 5px  #ffffff';
            //拖拽按钮显示阴影
            progressContainer.value.style.boxShadow = '0px 0px 5px  #ffffff';
            //进度条显示阴影
            const rect =progressContainer.value.getBoundingClientRect();
            //创建临时变量用于承接进度条的各种style属性
            const x = e.clientX - rect.left;
            //创建临时变量，用于计算鼠标坐标减去距离左侧边缘的距离得出起点位置
            const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
            progressbar.value.style.width = `${percent}%`;
            let temp = timeNum(audioPlayer.value.duration*(percent/100));
            temp_1.value = `${temp}`;
            const newtime = (percent/100)*audioPlayer.value.duration;
            dragbutton.value.style.left = `${(progressContainer.value.getBoundingClientRect().width)*(percent/100)+198}px`
            newcurrenttime = newtime;
        }
    }

    function onMouseUp(){
        if(dragmark.value){
            progressContainer.value.style.boxShadow = '';
            dragbutton.value.style.visibility = 'hidden';
            audioPlayer.value.currentTime = newcurrenttime;
            window.removeEventListener('mousemove',onMouseMove);
            window.removeEventListener('mouseup',onMouseUp);
            dragmark.value=false;
        }
    }

</script>


<style>
     .audioplayer{
        user-select: none;
        z-index: 9999;
        position: fixed;
        bottom: 0px;
        left: 0px;
        height: 80px;
        width: 100%;
        background-color: rgba(143, 143, 143, 0.514);
        
  }

    .toggleButton{
        position: absolute;
        top:10px;
        left: 40%;
    }
    #current-time{
        position: absolute;
        left: 160px;
        bottom: 6px;
    }

    #duration{
        position: absolute;
        right: 160px;
        bottom: 6px;
    }

    .playerControl{
        position: fixed;
        left: 200px;
        right: 200px;
        bottom: 9px;
        height: 15px;
        width: auto;
        background-color: #00000000;
        display: inline-block;
    }

    .progress-container{
        position: fixed;
        left: 200px;
        right: 200px;
        bottom: 15px;
        height: 3px;
        width: auto;
        background-color: #5b5b5b;
        display: inline-block;
    }

    #progressbar{
        z-index: 9998;
        background-color: #000000;
        height: 100%;
        width: 0%;  
    }

    #audioName{
        position: fixed;
        left: 150px;
        bottom: 57px;
    }

    #dragbutton{
        position: fixed;
        width: 5px;
        height: 5px;
        bottom: 12px;
        left: 195px;
        border:2px solid #000000;
        border-radius: 50%;
        background-color: #FFFFFF;
    }

</style>