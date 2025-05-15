<template>
    <div class="audiolists">
        <ul v-for="(audiolist) in audiolists" :key="audiolist.id" class="audiolist">
            <div class="content">
                <div class="audio_info">
                    <div>
                        <img ref="headshot" id="headshotimg" :src="audiolist.headshotpath ? `local://0/${audiolist.headshotpath}` : defaultheadshot" />
                    </div>
                    <div id="audioinfo">
                        <div class="audioname">
                            {{ audiolist.user_name }}
                        </div>
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
                
                <div class="tags-line">
                    <span v-for="tag in audiolist.selectedTags" :key="tag" class="tag">{{ tag }}</span>
                </div>
                <div class="audio_control">
                    <button id="renamebtn" @click="startRename(audiolist)">重命名</button>
                    <button id="editagsbtn" @click="editTags(audiolist)">修改标签</button>
                    <button id="previewplaybtn" @click="previewplay(audiolist)">播放</button>
                    <button id="deletebtn" @click="deleteaudio(audiolist)">删除</button>
                </div>
            </div>
            <div v-if="audiolist.isEditingTags" class="tag-editor">
                <div class="tagselector">
                        <div class="selectTags">
                        <button
                        class="selectBtn"
                        v-for="tag in allTags"
                        :key="tag"
                        :class="{'selected': audiolist.selectedTags.includes(tag)}"
                        @click="toggleTag(tag)"
                        >
                        {{ tag }}
                        </button>
                    </div>
                </div>
                <button id='saveTagsbtn'@click="saveTags(audiolist)">保存标签</button>
                <button id='cancelEditTagsbtn' @click="cancelEditTags(audiolist)">取消</button>
                </div>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import { useFileStore,useFileName } from "@/store/usefilestore";
import defaultheadshot from '/blankheadshot.png'

let data = null;
const audiolists = ref(null);
const editingId = ref(null);
const editName = ref('');
const allTags = ref(['自然', '科技', '机械', '人声', '噪音', '交互', '战斗', '过场', '搞笑']);

const recommend = async () => {
    const response = await fetch("http://localhost:3000/recent-audio");
    const result = await response.json();
    console.log(result);

    audiolists.value = result.data.map(audio => ({
        ...audio,
        selectedTags: [...(audio.tags || [])],  // 防止 tags 是 null
        isEditingTags: false
    }));
};

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

const editTags = (audiolist) => {
    audiolists.value.forEach(item => {
        item.isEditingTags = false;
    });

    audiolist.isEditingTags = true;

    if (!Array.isArray(audiolist.selectedTags)) {
        audiolist.selectedTags = [...(audiolist.tags || [])];
    }
};

const toggleTag = (tag) => {
    const editingAudio = audiolists.value.find(item => item.isEditingTags);
    if (!editingAudio) return;

    if (!Array.isArray(editingAudio.selectedTags)) {
        editingAudio.selectedTags = [];
    }

    const tags = editingAudio.selectedTags;
    const index = tags.indexOf(tag);

    if (index === -1) {
        if (tags.length >= 5) {
            return;
        }
        tags.push(tag);
    } else {
        tags.splice(index, 1);
    }
};

const saveTags = async (audiolist) => {
    const Id = audiolist.id;
    const newTags = audiolist.selectedTags;

    const response = await fetch("http://localhost:3000/savetags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
                        id:Id, 
                        tags: newTags 
                    })
    });

    data = await response.json();
    if (data.success) {
        audiolist.tags = [...newTags];
        audiolist.isEditingTags = false;
    }
};

const cancelEditTags = (audiolist) => {
    audiolist.isEditingTags = false;
    audiolist.selectedTags = [...(audiolist.tags || [])]; // 恢复原标签
};

onMounted(async () => {
    await recommend();
});

</script>

<style scoped>

.audiolist{
    display: flex;
    flex-direction: column;
    padding: 0px;
}

button{
    border: solid 0px;
    background-color: #c2c5cc;
    padding: 5px 10px;
    border-radius: 5px;
}

button:hover{
    background-color: #8b8e94;
    color: #ffffff;
}

.content:hover{
    background-color: #73778056;
}

.content{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin:0px 30px;
    padding: 10px 10px;
    border-radius: 7px;
    background-color:#c6cbd856 ;
}

.audio_info{
    display: flex;
    flex-direction: row;
    
}

#audioinfo{
    margin-left: 20px;
    margin-top: 4px;
}

.audio_control{
    display: flex;
    gap: 10px;
    margin-right: 40px;
}

#headshotimg{
    height: 50px;
    border:1px solid #ffffff;
    border-radius: 50%;
    margin-top: 2px;
}

.tag-editor{
    display: flex;
    flex-direction: column;
    display: flex;
    margin: 0px 150px;
    border-radius: 0px 0px 8px 8px;
    background-color: #e7e9f0;
}

.tags-line{
    position: absolute;
    left: 400px;
    display: flex;
}

.tag{
    margin: 10px 5px;
    padding: 2px 8px;
    border-radius: 5px;
    background-color: #c0c5cf;
}

.selectTags{
    margin: 10px 30px;
    
}

.selectBtn{
    margin:0px 10px ;
    background-color: #d6dbe2;
}

.selectBtn.selected{
    border: 2px  ;
    background-color: #6e7175;
}

#saveTagsbtn{
    position: relative;
    margin-top: 30px;
    width: 200px;
    left: 100px;
    
}

#cancelEditTagsbtn{
    position: relative;
    width: 200px;
    left: 100px;
    margin: 10px 0px;
    
}
</style>