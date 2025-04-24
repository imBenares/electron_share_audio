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
        <div>
            <ul v-for="audiolist in audiolists" :key="audiolist.audio_name" class="audiolist">
                <div id="audioname">
                    {{ audiolist.audio_name }}
                </div>
                <div class="listbtn">
                    <button id="playbtn" @click="previewplay(audiolist)">播放</button>
                    <button id="downloadbtn" @click="download(audiolist)">下载</button>
                </div>
            </ul>
        </div>
        <div>
            <button class="refresh" @click="refresh">刷新</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import { useFileStore,useFileName } from "@/store/usefilestore";

let data = null;
const searchQuery = ref(null);
const audiolists = ref(null);
const iscategory = ref(false);
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

onMounted(async () => {
    await recommend();
});

</script>

<style scoped>
.search-container {
  position: sticky;
  top: 0;
  
  z-index: 10;
  padding: 10px;
  
}

.search-input {
  padding: 5px;
  margin-right: 10px;
}

.result-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.audiolist {
    display: flex;
    margin-bottom: 15px;
    padding: 10px;
    list-style: none;
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
</style>