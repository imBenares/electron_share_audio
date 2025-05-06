<template>
    <div class="page">
        <div class="navigate">
            <div class="navigate_ul">
                <ul>
                    <RouterLink to="audio_audit" active-class="active">音频审核</RouterLink>
                </ul>
                <ul>
                    <RouterLink to="comment_audit" active-class="active">评论审核</RouterLink>
                </ul>
                <ul>
                    <RouterLink to="user_audit" active-class="active">用户审核</RouterLink>
                </ul>
                <ul>
                    <RouterLink to="/" active-class="active">退出登录</RouterLink>
                </ul>
            </div>
        </div>
        <div class="admin-content">
            <router-view></router-view>
        </div>
        <div>
            <audioplayer id="audioplayer" />
        </div>
    </div>
</template>
  
<script setup>

import { useRouter } from "vue-router";
import router from "../router/router";
import { ref,watch,onMounted, warn } from "vue";

onMounted(()=>{
    document.title = '欢迎来到管理员界面';
})

    
</script>

<style scoped>

.page{
    display: flex;
    flex-direction: column;
}

.navigate{
    background-color: #63b9ff;
}

.navigate_ul{
    display: flex;
    margin-left: 50px;
}

.navigate ul{
    padding: 20px 10px 0px 10px;
    margin: 0px 0px 0px 0px;
}

.navigate ul a{
    padding: 5px 20px 0px 20px;
    border-radius: 5px 5px 0px 0px;
    text-decoration: none ;
    color: #ffffff;
}

.navigate ul a.active{
    color: rgb(0, 0, 0);
    background-color: #ffffff;
}

.admin-content{
    position: absolute;
    top: 60px;
    left: 0px;
    right: 0px;
    bottom: 80px; /* 留出80px的空间 */
    overflow-y: auto; /* 使内容可滚动 */
    color: #000000;
}

</style>