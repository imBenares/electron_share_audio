<template>
    <div class="audiolists">
        <ul v-for="(userlist) in userlists" :key="userlist.id" class="userlist">
            <div id="user_info">
                <div>
                    <img ref="headshot" id="headshotimg" :src="userlist.headshotpath ? `local://0/${userlist.headshotpath}` : defaultheadshot" />
                </div>
                <div class="username">
                        {{ userlist.username }}
                </div>
            </div>
            <div class="list_control">
                <button id="deletebtn" @click="checkuser(userlist.id)">查看详情</button>
            </div>
            <div v-if="ischecking[userlist.id]" class="user-details">
                <div class="details">
                    <div>
                        userid:{{formatuserid(userlist.user_id)}}
                    </div>
                    <div>
                        生日:{{formatbirthdate(userlist.birthdate)}}
                    </div>
                    <div>
                        性别:{{formatgender(userlist.gender)}}
                    </div>
                    <div>
                        email:{{userlist.email}}
                    </div>
                    <div>
                        电话:{{userlist.tel}}
                    </div>
                </div>
                <div class="permission-details">
                    <div>
                        <label>
                        <input
                            type="checkbox"
                            v-model="userlist.upload_permissions"
                            :true-value="1"
                            :false-value="0"
                        />
                        上传权限
                        </label>
                    </div>
                    <div>
                        <label>
                        <input
                            type="checkbox"
                            v-model="userlist.comment_permissions"
                            :true-value="1"
                            :false-value="0"
                        />
                        评论权限
                        </label>
                    </div>
                    <div>
                        <button @click="savePermission(userlist)">保存权限</button>
                    </div>
                </div>
            </div>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import defaultheadshot from '/blankheadshot.png'


let data = null;
let response;
const userlists = ref(null);
const editingId = ref(null);
const editName = ref('');
const ischecking = ref([]);

const recommend = async() => {
    response = await fetch("http://localhost:3000/recent-user");
    const result = await response.json();
    //console.log(result);
    userlists.value = result.data; 
    console.log(result.data);
    
}

const checkuser = async(id) => {
    ischecking.value = [];
    ischecking.value[id] = true;
    
}

function formatuserid(userid){
    userid = userid + 100000;
    return userid;
}

function formatbirthdate(birthdate){
    const date = new Date(birthdate);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatgender(gender){
    if (gender == 1) {
      gender = "男";
    } else if (gender == 2) {
      gender = "女";
    } else {
      gender = "保密";
    }
    return gender;
}

const savePermission = async (user) => {
  const response = await fetch("http://localhost:3000/update-permission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      uploadPermission: user.upload_permissions,
      commentPermission: user.comment_permissions,
    }),
  });

  const result = await response.json();
  if (result.success) {
    alert("权限更新成功！");
  } else {
    alert("权限更新失败：" + result.message);
  }
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

.list_control{
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