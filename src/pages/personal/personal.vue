<template>
  <div class="root">
  <div class="information" v-if="!isEditingPassword">
    <div v-if="isEditHeadShot" class="crop-container">
      <div class="cropperimg">
        <img ref="image" :src="imageUrl" class="preview" />
      </div>
      <div class="headcontrols">
        <div>
          <button @click="saveImage" id="saveImage">裁剪并保存</button>
        </div>
        <div>
          <button @click="canclesave" id="canclesave">取消选择</button>
        </div>
      </div>
    </div>
    <div id="headshot">
      <div>
        <img ref="headshot" id="headshotimg" src="/blankheadshot.png" />
      </div>
      <div class="editHeadShot">
        <img
          @click="editHeadShot"
          id="editHeadShotBtn"
          src="/edit_head.png"
        />
      </div>
    </div>

    <div class="info">
      <div class="infoControl">
        <div id="infoHead">用户名:</div>
        <div id="infoContent" v-if="!isEditing">{{ usernametext }}</div>
        <input v-else class="inputclass" v-model="username" />
      </div>
      <div class="infoControl">
        <div id="infoHead">用户ID:</div>
        <div id="infoContent" v-if="!isEditing">{{ useridtext }}</div>
        <input v-else class="inputclass" v-model="useridtext" disabled/>
      </div>
      <div class="infoControl">
        <div id="infoHead">生<span class="space"></span>日:</div>
        <div id="infoContent" v-if="!isEditing">{{ birthdatetext }}</div>
        <div v-else>
            <vue-date-picker 
                v-model="birthdate"
                cancelText="取消" 
                selectText="选择"
                :enable-time-picker="false"
                :enable-time="false"
                :max-date="new Date()"
                type="date"
                :action-texts="{
                    cancel: '取消选择',
                    select: '确认日期'
                }"
                placeholder="选择你的出生日期"
            ></vue-date-picker></div>
      </div>
      <div class="infoControl">
        <div id="infoHead">性<span class="space"></span>别:</div>
        <div id="infoContent" v-if="!isEditing">{{ gendertext }}</div>
        <select v-else class="selectclass" v-model="gender" name="gender">
            <option value="1">男</option>
            <option value="2">女</option>
            <option value="3">保密</option>
        </select>
      </div>
      <div class="infoControl">
        <div id="infoHead">邮<span class="space"></span>箱:</div>
        <div id="infoContent" v-if="!isEditing">{{ emailtext }}</div>
        <input v-else class="inputclass" v-model="email" />
      </div>
      <div class="infoControl">
        <div id="infoHead">电<span class="space"></span>话:</div>
        <div id="infoContent" v-if="!isEditing">{{ teltext }}</div>
        <input v-else class="inputclass" v-model="tel" />
      </div>
      <div class="editbtn">
        <div>
          <button id="editinfobtn" @click="editInfoBtn" v-if="!isEditing">
            编辑信息
            <img id="editinfobtnImg" src="/button.png">
          </button>
          <div v-else>
              <button  id="saveInfoBtn" @click="saveInfoBtn">保存信息</button>
              <button  id="cancalEditBtn" @click="cancalEditBtn">取消修改</button>
          </div>
        </div>
        <div ref="edittip" id="edittip">{{ tip }}</div>
        <div>
          <button id="editPasswordBtn" @click="editingPasswordBtn">
            修改密码
            <img id="editinfobtnImg" src="/button.png">
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <div class="audio" v-if="!isEditingPassword">
    <ul v-for="audiolist in audiolists" :key="audiolist.id" class="audiolist">
      <div id="audioname">
        {{audiolist.audio_name}}
      </div>
      <div class="listbtn">
          <button id="playbtn" @click="previewplay(audiolist)">播放</button>
          <button id="deletebtn" @click="deleteaudio(audiolist)">删除</button>
          <button id="commentbtn" @click="comment(audiolist.id)">评论</button>
      </div>
      <div v-if="iscommenting[audiolist.id]" class="comment-section">
          <div class="commentscontainer">
            <div v-if="nan_comment">这儿什么都没有......</div>
              <ul v-for="(comment) in comments" :key="comment.id" class="comments">
                  <div class="comment">
                      <img ref="headshot" id="commentheadshotimg" :src="comment.headshotpath ? `local://0/${comment.headshotpath}` : defaultheadshot" />
                      <div class="user-comment">
                          <div id="username">{{ comment.username }}</div>
                          <div id="content">{{ comment.content }}</div>
                          <div id="created_at">{{ formatDate(comment.created_at) }}</div>
                      </div>
                  </div>
                  <div id="line"></div>
              </ul>
          </div>
      </div>
    </ul>
  </div>

  <div class="passwordEdit" v-else>
    <div class="editContent">
      <div class="control">
        <label for="oldpassword" class="lable">输入旧密码:</label>
        <input
          class="input"
          type="password"
          v-model="oldpassword"
          placeholder="请输入旧密码"
        />
      </div>
      <div class="control">
        <label for="newpassword" class="lable">输入新密码:</label>
        <input
          class="input"
          type="password"
          v-model="newpassword"
          placeholder="请输入新密码"
        />
      </div>
      <div class="control">
        <label for="makesure" class="lable">确认新密码:</label>
        <input
          class="input"
          type="password"
          v-model="makesure"
          placeholder="请确认新密码"
        />
      </div>
      <div ref="passwordtip" id="passwordtip">{{ tip }}</div>
    </div>
    <div class="editPasswordBtn">
      <button id="confirm" @click="onConfirm">确认修改</button>
      <button id="cancal" @click="onCancal">取消修改</button>
    </div>
  </div>
</div>
</template>

<script setup>

import { ref, onMounted, onUnmounted } from "vue";
import { useFileStore,useFileName } from "@/store/usefilestore";
import Cropper from "cropperjs";
import { format } from "date-fns";
import { watch } from "vue";
import 'cropperjs/dist/cropper.css';

let data = null;
let imagePath;

const newpassword = ref(null);
const oldpassword = ref(null);
const makesure = ref(null);
const isEditingPassword = ref(false);
const isEditing = ref(false);
const username = ref(" ");
const birthdate = ref(" ");
const gender = ref(" ");
const email = ref(" ");
const tel = ref(" ");
const useridtext = ref(" ");
const usernametext = ref(" ");
const birthdatetext = ref(" ");
const gendertext = ref(" ");
const emailtext = ref(" ");
const teltext = ref(" ");
const passwordtip = ref("");
const edittip = ref("");
const tip = ref("");
const imageUrl = ref("");
const image = ref(null);
const cropperInstance = ref(null);
const isEditHeadShot = ref(false);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const headshot = ref(null);
const comments = ref();
const iscommenting = ref([]);
const nan_comment = ref(false);

const audiolists = ref();
//该变量用于创建一个音频列表

function editInfoBtn() {
  isEditing.value = true;
  username.value = usernametext.value;
  birthdate.value = birthdatetext.value;
  gender.value = data.results.gender;
  email.value = emailtext.value;
  tel.value = teltext.value; 
}

function cancalEditBtn() {
  isEditing.value = false;
}

const saveInfoBtn = async () => {
    if(!username.value){
        tip.value = "用户名不能为空";
        edittip.value.style.visibility = '';
        return;
    }
    if(!emailRegex.test(email.value)){
        tip.value = "邮箱格式错误";
        edittip.value.style.visibility = '';
        return;
    }
    if(!tel.value){
        tip.value = "电话号码不能为空";
        edittip.value.style.visibility = '';
        return;
    }if
    ( tel.value.length != 7 && tel.value.length != 11){
        tip.value = "电话格式错误";
        edittip.value.style.visibility = '';
        return;
    }

    birthdate.value = formatTime(birthdate.value);
    const userId = localStorage.getItem("userId");
    
    try {
        const response = await fetch("http://localhost:3000/editinfo", {
                //向数据库发起请求
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({  userid: userId,
                                username: username.value ,
                                gender: gender.value,
                                birthdate: birthdate.value,
                                email: email.value,
                                tel: tel.value
                            })
            });
            //接收数据库请求
        data = await response.json();
        if (data.success) {
            tip.value = "修改成功";
            edittip.value.style.visibility = '';
            isEditing.value = false;
            usernametext.value = username.value;
            birthdatetext.value = birthdate.value;
            if (gender.value == 1) {
                gendertext.value = "男";
              } else if (gender.value == 2) {
                gendertext.value = "女";
              } else {
                gendertext.value = "保密";
              }
            emailtext.value = email.value;
            teltext.value = tel.value; 
            setTimeout(() => {
              edittip.value.style.visibility = 'hidden';
            }, 1500);
        } 
        } catch (error) {
            tip.value = "无法连接至服务器"
            edittip.value.style.visibility = '';
        }
  isEditing.value = false;
}

const editHeadShot = async()=>{
  imagePath = await fileAPI.selectImage();
  if(!imagePath.success){
    return;
  }
  
  isEditHeadShot.value = true;
  //console.log(imagePath.destPath[0]);
  imageUrl.value = `local://0/${imagePath.destPath[0]}`;
}

function editingPasswordBtn() {
  isEditingPassword.value = true;
  tip.value = '';
}

const onConfirm = async () => {
  // console.log('1111111111111111111');
  // console.log(username.value);
  // console.log(oldpassword.value);
  if(newpassword.value != makesure.value){
    tip.value = "输入两次的密码不同";
    passwordtip.value.style.visibility = '';
    return;
  }
  if(newpassword.value == null || oldpassword.value == null){
    tip.value = "密码不能为空";
    passwordtip.value.style.visibility = '';
    return;
  }
  //console.log('2222222222222222222222222');
  try{
    const response = await fetch("http://localhost:3000/login", {
                //向数据库发起请求
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({  
                                username: username.value,
                                password: oldpassword.value
                            })
            });
            //接收数据库请求
        data = await response.json();
        console.log(data.success);
        
        if (data.success) {
          //console.log('333333333333333333');
            try {
              const response = await fetch("http://localhost:3000/editpassword", {
                      //向数据库发起请求
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({  
                                      username: username.value,
                                      password: newpassword.value
                                  })
                  });
                  //接收数据库请求
              data = await response.json();
              if (data.success) {
                //console.log('4444444444444444444');
                alert('密码修改成功!!');
                isEditingPassword.value = false;
              } 
            } catch (error) {
                  tip.value = "无法连接至服务器"
                  edittip.value.style.visibility = '';
              }
        } else{
          tip.value = "旧密码输入错误";
          passwordtip.value.style.visibility = '';
        }

  }catch(error){

  }
}

function onCancal(){
    isEditingPassword.value = false;
    tip.value = '';
}

const fetchUserInfo = async () => {
  const userId = localStorage.getItem("userId");
  
  try {
    const response = await fetch("http://localhost:3000/getInfo", {
      //向数据库发起请求
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId }),
    });
    //接收数据库请求
    data = await response.json();

    if (data.results.gender == 1) {
      gendertext.value = "男";
    } else if (data.results.gender == 2) {
      gendertext.value = "女";
    } else {
      gendertext.value = "保密";
    }

    if (data.results.birthdate) {
      birthdatetext.value = formatTime(data.results.birthdate)
    }
    useridtext.value = Number(userId) + 100000;
    usernametext.value = data.results.username;
    username.value = data.results.username;
    emailtext.value = data.results.email;
    teltext.value = data.results.tel;
  } catch (error) {
    console.error("请求错误:", error);
  }
};

function formatTime(time){
    //该函数用于格式化时间
    if (time) {
        time = format(new Date(time), 'yyyy-MM-dd');
        //把从日期选择器获取的时间格式化成yyyy-mm-dd的格式
    }
    return time;
}
onMounted(async () => {
  await fetchUserInfo();
  await getHeadShot();
  await getaudiolist();
});

onMounted(() => {
  edittip.value.style.visibility = 'hidden';

});

// onUnmounted(() => {
//   if (cropper) {
//     cropper.destroy();
//   }
// });

const getaudiolist = async() => {
  const user_id = localStorage.getItem("userId");
  try {
    const response = await fetch("http://localhost:3000/getaudiolist",{
      method: "POST",
      headers:  { "Content-Type": "application/json" },
      body: JSON.stringify({  
                            userid: user_id ,
                            })
    })
    data = await response.json();
    audiolists.value = data.results;
  } catch (error) {
    console.log(error);
    
  }
  
}

const getHeadShot = async() => {
  const userid = localStorage.getItem("userId");
  const imagepath = await fileAPI.checkFile(userid);
  if(imagepath){
    headshot.value.src = `local://0/${imagepath}`;
  }
}

const comment = async(id) => {
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
    }else{
      nan_comment.value = false;
    }
    comments.value = result;
}

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

watch(()=>image.value,(newImage)=>{
  if (!newImage) return;

  // 销毁旧实例
  if (cropperInstance.value) {
    cropperInstance.value.destroy();
    cropperInstance.value = null;
  }

  // 确保图片已加载完成
  if (newImage.complete) {
    initCropper(newImage);
  } else {
    newImage.onload = () => initCropper(newImage);
  }

  function initCropper(imgElement) {
  cropperInstance.value = new Cropper(imgElement, {
    aspectRatio: 1,
    viewMode: 2,
    autoCropArea: 0.8,
    cropBoxResizable: true,
    responsive: true,
    // 可选：检查控制台是否打印错误
    checkCrossOrigin: false,
    ready() {
      console.log('Cropper 初始化完成');
    }
  });
}
})

const saveImage = async() => {
  const user_id = localStorage.getItem("userId")
  
  if (!cropperInstance.value) return;
  // 获取裁剪区域的 Blob 数据
  cropperInstance.value.getCroppedCanvas().toBlob(async (blob) => {
    if (!blob) {
      console.error("裁剪失败，未生成 blob 数据");
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onloadend = async () => {
      try {
        const imgbuffer = new Uint8Array(reader.result);
        const reply = await fileAPI.updateImage(imgbuffer, imagePath.destPath[0], user_id);
        isEditHeadShot.value = false;
        console.log("图片保存成功:", reply);
        await getHeadShot();
      } catch (error) {
        console.error("保存图片时出错:", error);
      }
    };
  });  
 
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
  //console.log(data);
  if(data.success){
    await getaudiolist();
  }
  
}

const canclesave = async() => {
  await fileAPI.deleteFile(imagePath.destPath[0]);
  isEditHeadShot.value = false;
}

</script>

<style scoped>

.root{
  position: absolute;
  display: flex;
  height: auto;
  width: 100%;
  top: 0px;
  bottom: 0px;
}

.information {
  display: flex;
  left: 0px;
  flex-direction: column;
  align-items: center;
  height: auto;
  width: 35%;
  top: 0px;
  bottom: 0px;
  min-width: 330px;
  background-color: #3d41573b;
}

.info {
  margin-top: 240px;
  width: 300px;
}

#infoHead {
  width: 60px;
  margin-top: 4px;
}

.crop-container{
  z-index: 9999;
  position: absolute;
  left: 20px;
  top: 20px;
  height: 450px;
  width: 400px;
  border:2px solid #212939;
  border-radius: 15px;
  background-color: #1e2731d7;
}

.cropperimg{
  margin-top: 20px;
  height: 250px;
}

#saveImage{
  position: absolute;
  top: 300px;
  margin-left: 25px;
  border: none;
  width: 200px;
  height: 40px;
  border-radius: 10px;
  text-align: left;
  padding-left: 20px;
  font-size: 18px;
  color: #b7c8d8;
  background-color: #4f576c;
}

#saveImage:hover{
  background-color: #646d88;
}

#canclesave{
  position: absolute;
  top: 370px;
  margin-left: 25px;
  border: none;
  width: 200px;
  height: 40px;
  border-radius: 10px;
  text-align: left;
  padding-left: 20px;
  font-size: 18px;
  color: #b7c8d8;
  background-color: #4f576c;
}

#canclesave:hover{
  background-color: #646d88;
}


#infoContent{
  margin-top: 5px;
}

#editinfobtn{
  position: absolute;
  margin-top: 20px;
  border: none;
  width: 240px;
  height: 40px;
  border-radius: 20px;
  text-align: left;
  padding-left: 20px;
  font-size: 18px;
  background-color: #1f253441;
}

#editinfobtn:hover{
  background-color: #0e111779;
}

#editinfobtnImg{
  position: absolute;
  height: 34px;
  bottom: 3px;
  right: 4px;
  
}

#saveInfoBtn{
  position: absolute;
  border: none;
  margin-top: 20px;
  width: 110px;
  height: 40px;
  border-radius: 20px;
  font-size: 18px;
  background-color: #1f253441;
}

#cancalEditBtn{
  position: absolute;
  left: 130px;
  border: none;
  margin-top: 20px;
  width: 110px;
  height: 40px;
  border-radius: 20px;
  font-size: 18px;
  background-color: #1f253441;
}

#saveInfoBtn:hover{
  background-color: #0e111779;
}

#cancalEditBtn:hover{
  background-color: #0e111779;
}

.space {
  width: 16px;
  display: inline-block;
}

.alphabetspace{
  width: 32px;
  display: inline-block;
}



#headshot {
  position: absolute;
  margin-top: 60px;
  height: 130px;
  width: 130px;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

#headshotimg {
  height: 100%;
  width: 100%;
  border-radius: 50%;
}

.infoControl {
  display: flex;
  margin-bottom: 10px;
  height: 35px;
}

.editHeadShot {
  position: absolute;
  right: 0px;
  height: 30px;
  width: 30px;
  bottom: 0px;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

#editHeadShotBtn {
  height: 100%;
  width: 100%;
  border-radius: 50%;
}

#editHeadShotBtn:hover{
  filter: brightness(80%);
}

.passwordEdit {
   display: flex;
  flex-direction: column;
  align-items: center;        
  justify-content: center;    
  min-height: 100vh;          
  width: 100%;  
}

.editContent {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 300px; /* 控制内容最大宽度 */
}

.control {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.input {
    border: none;
    width: 100%;
    padding: 0.5rem;
    border-radius: 5px;
    background-color: #2a355032;
    height: 30px;
    width: 300px;
}

.input:focus {
    outline: none;
    background-color: #10141e61;
}

.input::placeholder {
    color: #1c20298f;
    opacity: 1;
}

.editbtn{
  position: absolute;
}

#confirm{
    position: relative;
    border: none;
    height: 60px;
    width: 120px;
    left: -22px;
    border-radius: 5px;
    background-color: #2a355032;
}

#cancal {
    position: relative;
    border: none;
    left: 38px;
    height: 60px;
    width: 120px;
    border-radius: 5px;
    background-color: #2a355032;
}

#confirm:hover {
    background-color: #1e263857;
}

#cancal:hover {
    background-color: #1e263857;
}

.input::placeholder {
    color: #1c20298f; 
    opacity: 1; 
}

#editPasswordBtn{
  position: absolute;
  width: 240px;
  top: 90px;
  border: none;
  border-radius: 20px;
  height: 40px;
  text-align: left;
  padding-left: 20px;
  font-size: 18px;
  background-color: #1f253441;
}

#editPasswordBtn:hover{
  background-color: #0e111779;
}

#edittip{
  position: absolute;
  top: 216px;
  color: #ff0000;
}

#passwordtip{
  color: #ff0000;
}

::v-deep(.dp__input_wrap){
    position:relative;
    width: 180px;
    
}

::v-deep(.dp__pointer){
    height: 35px;
    border: none;
    background-color: #1c23355a;
    border-radius: 5px;
}

::v-deep(.dp__cell_inner){
  background-color: #ffffff;
}

::v-deep(.dp__active_date){
  background-color: #138dff;
}

::v-deep(.dp__input_icon){
    color: #000000;
    
}
::v-deep(.dp__icon){
    color: #000000;
}

.inputclass{
  width: 176px;
  border-radius: 5px;
  background-color: #1c23355a;
  border: none;
}

.inputclass:focus{
  outline: none;
  background-color: #10141e61;
}

.selectclass{
  width: 60px;
  border-radius: 5px;
  background-color: #1c23355a;
  border: none;
}

.audio {
  position: relative;
  flex: 1; /* 右侧自适应 */
  display: flex;
  flex-direction: column;
  height: auto;
  display: flex;
  height: auto;
  background-color: #41506825;
  overflow-y: auto;
}

.audiolist{
  display: flex;
  flex-direction: column;
  padding-left: 0px;
}

#audioname{
  
  width: 100%;
  margin-left:30px ;
  margin-right: 100px;
}

.listbtn{
  position: absolute;
  right: 20px;
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

#commentheadshotimg{
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
</style>
