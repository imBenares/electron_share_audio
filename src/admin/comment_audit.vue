<template>
    <div class="audiolists">
        <ul v-for="(commentlist) in commentlists" :key="commentlist.id" class="commentlist">
            <div class="content">
                <div class="user_info">
                    <div>
                        <img ref="headshot" id="headshotimg" :src="commentlist.headshotpath ? `local://0/${commentlist.headshotpath}` : defaultheadshot" />
                    </div>
                    <div class="comment_info">
                        <div>
                            {{ commentlist.user_name }}
                        </div>
                        <div>
                            {{ commentlist.content }}
                        </div>
                    </div>
                </div>
                <div class="comment_control">
                    <button id="deletebtn" @click="deletecomment(commentlist)">删除</button>
                </div>
            </div>
            
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import defaultheadshot from '/blankheadshot.png'


let data = null;
const commentlists = ref(null);
const editingId = ref(null);
const editName = ref('');

const recommend = async() => {
    const response = await fetch("http://localhost:3000/recent-comment");
    const result = await response.json();
    //console.log(result);
    commentlists.value = result.data; 
}

const deletecomment = async(commentlist) => {
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

onMounted(async () => {
    await recommend();
});

</script>

<style scoped>

.comment_info{
    display: flex;
    flex-direction: column;
    margin-left: 20px;
    margin-top: 4px;
}

.content{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10px 0px 10px 0px;
}

.user_info{
    display: flex;
    
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

.commentlist{
    display: flex;
    flex-direction: column;
    margin: 10px 30px;
    border-radius: 7px;
    background-color:#c6cbd856 ;
}

.audiolist:hover{
    background-color: #73778056;
}

.comment_control{
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

</style>