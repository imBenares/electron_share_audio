<template>
    <div class="register">
        <div>
            <div class="control">
                <label for="usernmae" class="lable">用户名:</label>
                <input class="inputclass" type="text" v-model="username"  placeholder="请输入用户名"/>
            </div>
            <div class="control">
                <label for="password" class="lable">输入密码:</label>
                <input class="inputclass" type="password" v-model="password"  placeholder="请输入密码"/>
            </div>
            <div class="control">
                <label for="makesure"class="lable">确认密码:</label>
                <input class="inputclass" type="password" v-model="makesure"  placeholder="请确认密码"/>
            </div>
            <div class="control">
                <label for="gender"class="lable">性别:</label>
                <select class="selectclass" v-model="gender" name="gender">
                    <option value="1">男</option>
                    <option value="2">女</option>
                    <option value="3">保密</option>
                </select>
            </div>
            <div class="control">
                <label for="birthdate"class="lable">出生日期:</label>
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
                    ></vue-date-picker>
            </div>
            <div class="control">
                <label for="email"class="lable">电子邮箱:</label>
                <input class="inputclass" type="text" v-model="email"  placeholder="请输入电子邮箱"/>
            </div>
            <div class="control">
                <label for="tel"class="lable">电话:</label>
                <input class="inputclass" type="text" v-model="tel"  placeholder="请输入电话号码"/>
            </div>
        </div>
        <div ref="errortip" id="errortip">{{ tip }}</div>
        <div class="btn">
            <div>
                <button id="registerbtn" @click="handleRegister">注册</button>
            </div>
            <div>
                <button id="backbtn" @click="back">返回登录</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref,onMounted } from "vue";
import { format } from 'date-fns';
import { useRouter } from "vue-router";
import "@vuepic/vue-datepicker/dist/main.css"

const router = useRouter();
const username = ref(null);
const password = ref(null);
const makesure = ref(null);
const gender = ref(null);
const birthdate = ref(null);
const email = ref(null);
const tel = ref(null);
const errortip = ref(null);
const tip = ref(" ");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formateTime(){
    //该函数用于格式化时间
    if (birthdate.value) {
        birthdate.value = format(new Date(birthdate.value), 'yyyy-MM-dd');
        //把从日期选择器获取的时间格式化成yyyy-mm-dd的格式
    }
}
const handleRegister = async () => {
    if(!username.value || !password.value){
        tip.value = "用户名或密码不能为空";
        errortip.value.style.visibility = '';
        return;
    }
    if(password.value != makesure.value){
        tip.value = "两次密码输入不一致";
        errortip.value.style.visibility = '';
        return;
    }
    if(!emailRegex.test(email.value)){
        tip.value = "邮箱格式错误";
        errortip.value.style.visibility = '';
        return;
    }
    if(!tel.value){
        tip.value = "电话号码不能为空";
        errortip.value.style.visibility = '';
        return;
    }if
    ( tel.value.length != 7 && tel.value.length != 11){
        tip.value = "电话格式错误";
        errortip.value.style.visibility = '';
        return;
    }

    formateTime();
    
    try {
        const response = await fetch("http://localhost:3000/register", {
                //向数据库发起请求
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({  username: username.value ,
                                password: password.value,
                                gender: gender.value,
                                birthdate: birthdate.value,
                                email: email.value,
                                tel: tel.value
                            })
            });
            //接收数据库请求
        const data = await response.json();
        
        if (data.message == 1) {
            tip.value = "注册成功，即将返回登录";
            errortip.value.style.visibility = '';
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } 
        if(data.message == 0){
            tip.value = "用户名已被注册";
            errortip.value.style.visibility = '';
        }
        } catch (error) {
            tip.value = "无法连接至服务器"
            errortip.value.style.visibility = '';
        }
};

function back(){
    router.push("/");
}

onMounted(() => {
  //inputRef.value?.focus();
  errortip.value.style.visibility = 'hidden';
});

window.addEventListener('keydown', (event) => {
    if(event.key === 'Enter'){
        handleRegister();
    }
});

</script>

<style scoped>
    ::v-deep(.dp__input) {
        position:relative;
        width: 200px;
        height: 29px;
        left: 100px;
        bottom: 10px;
        background-color: #ffffff;
        border: 1px solid black;
    }
    ::v-deep(.dp__input_icon){
        position:relative;
        left: 100px;
        bottom: 25px;
    }
    .register{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 90vh;
        
    }
    .inputclass{
        position:relative;
        display: flex;
        width: 250px;
        left: 100px;
        bottom: 10px;
        height: 25px;
        border-radius:4px;
        border: 1px solid black;
    }
    .selectclass{
        position:relative;
        display: flex;
        left: 100px;
        bottom: 10px;
        height: 29px;
        width: 70px;
        border-radius:4px;
        border: 1px solid black;
    }
    .control{
        width: 300px;
        height: 25px;
    }
    .lable{
        display: flex;
        height: 0px;
        width: 90px;
        margin: 10px;
        }
    .btn{
        display: flex;
        width: 150px;
    }
    .birthdate{
        display: flex;
    }
    #registerbtn{
        position: relative;
        top: 50px;
        left: -64px;
        height: 55px;
        width: 120px;
        font-size: 23px;
    }
    #backbtn{
        position: relative;
        top: 50px;
        left: 40px;
        height: 55px;
        width: 120px;
        font-size: 23px;
    }
    #errortip{
        position: relative;
        top: 10px;
        left: 10px;
        color: #ff0000;
    }
</style>

