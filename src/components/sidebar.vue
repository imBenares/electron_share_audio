<template>
    <div>
    </div>
    <div class="navigate">
        <div class="navigate-ul">
            <ul>
                <RouterLink to="home" active-class="active">首页</RouterLink>
            </ul>
            <ul>
                <RouterLink to="personal" active-class="active">个人主页</RouterLink>
            </ul>
            <ul>
                <RouterLink to="edit" active-class="active">编辑音频</RouterLink>
            </ul>
            <ul>
                <RouterLink to="/" active-class="active">退出登录</RouterLink>
            </ul>
        </div>
    </div>
</template>


<script setup>
import { RouterLink, useRouter } from 'vue-router';

</script>

<style scoped>
    .navigate{
        user-select: none;
        position: fixed;
        top:0px;
        bottom:80px;
        left: 0px;
        width: 180px;
        height: auto;
        background-color: #606f7f2f;
        
    }
    .navigate-ul{
        position: absolute;
        top: 90px;
    }
    .navigate ul {
        padding: 10px;
        padding-top: 5px;
        padding-bottom: 5px;
        height: 40px;
        width: 160px;
        list-style: none; 
        margin: 0px 0; 
        
    }
    
    .navigate ul a{
        display: block;
        padding-left: 10px;
        line-height:38px;
        letter-spacing:3px;
        height: 100%;
        border-radius: 5px;
        color: black;
        text-decoration: none ;
    }
    .navigate ul a:hover{
        color: rgb(0, 0, 0);
        background-color: #3e3f4f40;
    }
    .navigate ul a.active{
        color: rgb(255, 255, 255);
        background-color: #2f304358;
    }
    .main-content{
        position: fixed;
        top: 0px;
        bottom: 80px;
        left: 150px;
        right: 0px;
        width: 100%;
        height: 100%;
    }
</style>