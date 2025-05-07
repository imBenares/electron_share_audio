<template>
    <div class="login">
        <div class="logininput">
            <div>账号:</div>
            <input ref="inputRef" type="text" @keyup.enter="handleLogin" v-model="username"  placeholder="请输入账号"/>
        </div>
        <div class="passwordinput">
            <div>密码:</div>
            <input type="password" @keyup.enter="handleLogin" v-model="password"  placeholder="请输入密码"/>
        </div>
        <div ref="errortip" id="errortip">{{ tip }}</div>
        <button id="loginbuttom" @click="handleLogin">登录</button>
        <button id="loginbuttom" @click="toRegister">注册</button>
    </div>
</template>

<script setup>
import { ref,watch,onMounted, warn } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref("");
const password = ref("");
const inputRef = ref(null);
const errortip = ref(null);
const tip = ref(" ");

localStorage.setItem("userId", 0);

function toRegister(){
    router.push("/register");
}

const handleLogin = async () => {
    localStorage.setItem("isLoggedIn", "false");
    
    try {
        if(username.value ==="" || password.value === ""){
            //检测输入是否为空，如果为空，则不与数据库通信，直接报错
            tip.value = "账号或密码不能为空";
            errortip.value.style.visibility = '';
            setTimeout(() => {

                
            //把焦点重置到输入账号上
                inputRef.value?.focus();
                }, 0);
                return;
        };
            const response = await fetch("http://localhost:3000/login", {
                //向数据库发起请求
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.value, password: password.value })
            });
           //接收数据库请求
            const data = await response.json();
            console.log(data);
            
            if (data.success) {
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("userId", data.id);
                localStorage.setItem("userName", data.name);
                localStorage.setItem("key", data.key);
                if (data.key === 1) {
                    router.push("/admin"); // 管理员跳转
                } else {
                    router.push("/mainpage"); // 普通用户跳转
                } 
            } else {
                tip.value = "账号或密码输入错误"
                errortip.value.style.visibility = '';
                username.value = "";
                password.value = "";
                
                setTimeout(() => {
                inputRef.value?.focus();
                }, 0);
            }
        } catch (error) {
            tip.value = "无法连接至服务器"
            errortip.value.style.visibility = '';
        }
};

onMounted(() => {
  localStorage.clear()
  inputRef.value?.focus();
  errortip.value.style.visibility = 'hidden';
});


</script>

<style scoped>
    .login{
        user-select: none;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        height: 100vh;
    }
    .logininput{
        display: flex;
    }
    .passwordinput{
        margin-top: 10px;
        display: flex;
    }
    #loginbuttom{
        width: 90px;
        height: 40px;
        margin-right: 51px;
        margin-top: 40px;
    }
    #errortip{
        color: #FF0000; 
    }
</style>