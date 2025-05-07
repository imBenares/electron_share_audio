<template>
    <div class="page-wrapper">
        <div class="search-container">
            <input 
                type="search"
                v-model="searchQuery"
                class="search-input"
                placeholder="搜索音效..."
                aria-label="音效搜索"
                @keyup.enter="searchSounds"
                >
            <button @click="searchSounds">
                搜索
            </button>
            <button @click="category">
                分类 
            </button>
        </div>
        <div v-if="iscategory" class="category">
            <button
                v-for="cat in categories"
                :key="cat.id"
                @click="fetchByCategory(cat.id)"
                >
                 {{ cat.name }}
            </button>
            <div>
                <button @click="uncategory">取消分类</button>
            </div>
        </div>
        <div class="audio">
            <div class="audiolists">
                <ul v-for="(audiolist) in audiolists" :key="audiolist.id" class="audiolist">
                    <div class="audio-control" ref="audiocontrol" :class="{ 'highlight': iscommenting[audiolist.id] }">
                        <div id="audioname">
                            {{ audiolist.audio_name }}
                        </div>
                        <div class="listbtn">
                            <button id="playbtn" @click="previewplay(audiolist)">播放</button>
                            <button id="downloadbtn" @click="download(audiolist)">下载</button>
                            <button id="commentcontrolbtn" @click="startcomment(audiolist.id)">评论</button>
                        </div>
                    </div>
                    <div v-if="iscommenting[audiolist.id]" class="comment-section">
                        <div class="commentscontainer">
                            <div v-if="nan_comment">这儿什么都没有......</div>
                            <ul v-for="(comment) in comments" :key="comment.id" class="comments">
                                <div class="comment">
                                    <img ref="headshot" id="headshotimg" :src="comment.headshotpath ? `local://0/${comment.headshotpath}` : defaultheadshot" />
                                    <div class="user-comment">
                                        <div id="username">{{ comment.username }}</div>
                                        <div id="content">{{ comment.content }}</div>
                                        <div id="created_at">{{ formatDate(comment.created_at) }}</div>
                                    </div>
                                </div>
                                <div id="line"></div>
                            </ul>
                        </div>
                        <textarea
                            type="text"
                            v-model="audiolist.commentcontent"
                            placeholder="在此处留下你的评论..."
                            class="comment-input"
                        ></textarea>
                        <div class="comment-control">
                            <button @click="submitcomment(audiolist,audiolist.id,audiolist.commentcontent)" id="submitcommentbtn">确认发布</button>
                            <button @click="cancelcomment(audiolist.id)" id="canclecommentbtn">取消评论</button>
                        </div>
                    </div>
                </ul>
            </div>
        </div>
        <div>
            <button class="refresh" @click="refresh">刷新</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import { useFileStore,useFileName } from "@/store/usefilestore";
import defaultheadshot from '/blankheadshot.png'

let data = null;
const searchQuery = ref(null);
const audiolists = ref(null);
const comments = ref();
const iscategory = ref(false);
const iscommenting = ref([]);
const audiocontrol = ref(null);
const nan_comment = ref(false);
const categories = [
  { id: 1, name: "自然" },
  { id: 2, name: "科技" },
  { id: 3, name: "机械" },
  { id: 4, name: "人声" },
  { id: 5, name: "噪音" },
  { id: 6, name: "交互" },
  { id: 7, name: "战斗" },
  { id: 8, name: "过场" },
  { id: 9, name: "搞笑" },
];

const searchSounds = async() => {
    if(!searchQuery.value){
        return;
    }
    const response = await fetch("http://localhost:3000/search",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({  
                                keyword: searchQuery.value,
                            })
    })
    data = await response.json();
    audiolists.value = data;
}

const previewplay = async(audiolist) => {
    const fileId = audiolist.id;
    const fileurl = new Array;
    const audioname = new Array;
    fileurl[0] = `http://localhost:3000/stream/audio/${fileId}`;
    audioname[0] = audiolist.audio_name
    const filestore = useFileStore();
    filestore.setFileList(fileurl);

    const filename = useFileName();
    filename.setNameList(audioname);

}

const download = async(audiolist) => {
    const id = audiolist.id;
    const filename = audiolist.audio_name;

  // 调用主进程方法（通过 preload 暴露的）
    const path = await fileAPI.selectFolder();
    await uploadAPI.downloadAudio(path,id,filename);
}

const startcomment = async(id) => {
    iscommenting.value = [];
    iscommenting.value[id] = true;
    const response = await fetch("http://localhost:3000/getcomment",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
                                Id: id
                            })
    });
    const result = await response.json();
    if(result.length === 0){
      nan_comment.value = true;
    }
    comments.value = result;
    audiocontrol.value[id].style['background-color'] = '#8585853a';
}

function cancelcomment(id){
    iscommenting.value[id] = false;
    
}

const submitcomment = async(audiolist,id,commentcontent) => {
    const userId = localStorage.getItem("userId")
    const username = localStorage.getItem("userName");
    console.log(username);
    
    const response = await fetch("http://localhost:3000/submitcomment",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
                                Id: id,
                                commentcontent: commentcontent,
                                userId: userId,
                                username: username
                            })
    });
    const result = await response.json();
    if(result.message){
        const response = await fetch("http://localhost:3000/getcomment",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
                                Id: id
                            })
    });
    const result = await response.json();
    comments.value = result;
    audiolist.commentcontent = null;
    }
}

const recommend = async() => {
    const response = await fetch("http://localhost:3000/recommend");
    const result = await response.json();
    audiolists.value = result;
}

const refresh = async() => {
    await recommend();
}

const category = async() => {
    iscategory.value = true;
}

function uncategory(){
    iscategory.value = false;
}

const fetchByCategory = async (categoryId) => {
  const response = await fetch("http://localhost:3000/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
                                Id: categoryId,
                            })
    });
  const result = await response.json();
  audiolists.value = result;
};

function formatDate(created_at){
    const date = new Date(created_at);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
}

onMounted(async () => {
    await recommend();
});

</script>

<style scoped>

.audio{
    position: absolute;
    top:60px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    overflow-y: auto;
}
.search-container {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 10px;
}

.search-input {
  padding: 0px 30px;
  margin-right: 10px;
  margin-left: 10px;
  height: 35px;

  border: 0px solid;
  border-radius: 20px;
  background-color: #1f20209f;
  width: 400px;
}

.result-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
 
.refresh{
    position: fixed;
    bottom: 120px;
    right: 50px;
}

.category{
    position: relative;
    height: 80px;
    width: 100%;
    background-color: #1c222b44;
}

.audiolists{
    display: flex;
    flex-direction: column;
}

.audiolist{
    display: flex;
    flex-direction: column;
    margin: 0px;
    padding: 0px;
    border-radius: 7px;
    list-style: none;
}

.audio-control{
    display: flex;
    flex-direction: row;
    padding: 20px 20px;
    margin: 0px 20px;
    border-radius: 7px;
}

.audio-control:hover{
    background-color: #8585853a;
}

.listbtn{
    position: absolute;
    right: 50px;
}

.comment-section{
    margin: 0px 40px;
    padding:10px 30px 5px 30px;
    border-radius: 0px 0px 7px 7px;
    background-color: #3236385d;
}

.commentscontainer{
    max-height: 300px;
    overflow-y: auto;
}

.comments{
    margin-top: 20px;
    margin-bottom: 20px;
    padding-left: 0px;
}

.comment{
    display: flex;
    flex-direction: row;
}

.comment-input{
    box-sizing: border-box;
    width: 100%;
    height: 80px;
    border-radius:7px;
    border:0px solid;
    padding: 15px;
    resize: none;
    background-color: #23242554;
}

.comment-input:focus{
    outline: none;
    background-color: #1b1c1d54;
}

.user-comment{
    margin-left: 15px;
}

#headshotimg{
    height: 50px;
    border:1px solid #ffffff;
    border-radius: 50%;
    margin-top: 2px;
}

#username{
    font-weight:bold;
    color: #3b94dd;
    margin-bottom: 5px;
}

#created_at{
    font-size: 13px;
    margin-top: 10px;
    color: #afafaf;
    margin-bottom: 20px;
}

#line{
    height: 1px;
    width: 100%;
    background-color: #d5eaf860;
    box-shadow: 0px 0px 1px #afafaf;
}

button{
    border:0px solid;
    padding: 8px 20px;
    border-radius: 20px;
    background-color: #212324a9;
    color: #d0d4d6;
}

#submitcommentbtn{
    margin: 10px 0px;
}

#canclecommentbtn{
    margin-left: 50px;
}

input[type="text"]::placeholder {
  color: #999; /* placeholder 文字颜色 */
  font-size: 14px; /* placeholder 文字大小 */
  text-align: left; /* 控制 placeholder 水平对齐 */
}

.highlight {
    background-color: #8585853a;
}


/* 定义滚动条的整体宽度 */
::-webkit-scrollbar {
  width: 7px;  
  height: 10px; 
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
  background: #f0f0f000; /* 轨道背景色 */
  border-radius: 10px;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background: #5e5e5e7c; /* 滑块的背景色 */
  border-radius: 10px;
}

/* 滑块在鼠标悬停时的样式 */
::-webkit-scrollbar-thumb:hover {
  background: #8383837c; /* 滑块的背景色，鼠标悬停时 */
}

/* 滚动条按钮 */
::-webkit-scrollbar-button {
  display: none; /* 隐藏滚动条的按钮 */
}

/* 滚动条的角落（交汇处） */
::-webkit-scrollbar-corner {
  background: transparent;
}

</style>