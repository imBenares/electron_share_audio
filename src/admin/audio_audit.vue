<template>
    <div class="audiolists">
        <ul v-for="(audiolist) in audiolists" :key="audiolist.id" class="audiolist">
            <div id="audio_info">
                <div id="audioname">
                    <div v-if="editingId === audiolist.id">
                        <input
                            v-model="editName"
                            @keyup.enter="saveRename(audiolist)"
                            class="rename-input"
                        />
                        <button @click="saveRename(audiolist)">保存</button>
                    </div>
                    <div v-else>
                        {{ audiolist.audio_name }}
                    </div>
                </div>
            </div>
            <div class="audio_control">
                <button id="renamebtn" @click="startRename(audiolist)">重命名</button>
                <button id="previewplaybtn" @click="previewplay(audiolist)">播放</button>
                <button id="deletebtn" @click="deleteaudio(audiolist)">删除</button>
            </div>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import { useFileStore,useFileName } from "@/store/usefilestore";

let data = null;
const audiolists = ref(null);
const editingId = ref(null);
const editName = ref('');

const recommend = async() => {
    const response = await fetch("http://localhost:3000/recent-audio");
    const result = await response.json();
    console.log(result);
    
    audiolists.value = result.data; 
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

const deleteaudio = async(audiolist) => {
  const fileId = audiolist.id;
  const response = await fetch("http://localhost:3000/deleteaudio",{
      method: "POST",
      headers:  { "Content-Type": "application/json" },
      body: JSON.stringify({  
                            fileId: fileId ,
                            })
  })
  data = await response.json();
  console.log(data);
  if(data.success){
    await recommend();
  }
  
}

const saveRename = async (audiolist) => {
  const editname = editName.value;
  const fileId = audiolist.id;
  const userid = localStorage.getItem("userId")
  const response = await fetch("http://localhost:3000/saverename",{
        method: "POST",
        headers:  { "Content-Type": "application/json" },
        body: JSON.stringify({  
                            editname: editname ,
                            fileId: fileId ,
                            userid: userid,
                            })
  })
  data = await response.json();
  if(data.success){
    const index = audiolists.value.findIndex(item => item.id === fileId);
    if (index !== -1) {
      audiolists.value[index].audio_name = editname;
    }
  }
  editingId.value = null;
};

const startRename = (audiolist) => {
  editingId.value = audiolist.id;
  editName.value = audiolist.audio_name;
};

onMounted(async () => {
    await recommend();
});

</script>

<style scoped>

.audiolist{
    display: flex;
    flex-direction: row;
}

.audio_control{
    position: absolute;
    right: 50px;
}


</style>