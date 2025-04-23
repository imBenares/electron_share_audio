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
            <button>
                分类 
            </button>
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
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useFileStore,useFileName } from "@/store/usefilestore";

let data = null;
const searchQuery = ref(null);
const audiolists = ref(null);

const searchSounds = async() => {
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
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ccc;
  list-style: none;
}
   
</style>