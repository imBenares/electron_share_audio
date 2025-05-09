<template>
    <div class="audiolists">
        <ul v-for="(userlist) in userlists" :key="userlist.id" class="userlist">
            <div id="comment_info">
                <div id="content">
                        <div>
                            <img ref="headshot" id="headshotimg" :src="userlist.headshotpath ? `local://0/${userlist.headshotpath}` : defaultheadshot" />
                        </div>
                        <div class="user-comment">
                            <div>
                                {{ userlist.username }}
                            </div>
                        </div>
                </div>
            </div>
            <div class="comment_control">
                <button id="deletebtn" @click="deletecomment(userlist)">查看详情</button>
            </div>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import defaultheadshot from '/blankheadshot.png'


let data = null;
const userlists = ref(null);
const editingId = ref(null);
const editName = ref('');

const recommend = async() => {
    const response = await fetch("http://localhost:3000/recent-user");
    const result = await response.json();
    //console.log(result);
    userlists.value = result.data; 
}

const deletecomment = async(userlist) => {
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

.userlist{
    display: flex;
    flex-direction: row;
}

.comment_control{
    position: absolute;
    right: 50px;
}

#headshotimg{
    height: 50px;
    border:1px solid #ffffff;
    border-radius: 50%;
    margin-top: 2px;
}

</style>