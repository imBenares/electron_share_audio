<template>
    <div>欢迎来到管理员界面</div>
    <div class="navigate">
        <ul>
            <button>音频审核</button>
        </ul>
        <ul>
            <button>评论审核</button>
        </ul>
        <ul>
            <button>用户审核</button>
        </ul>
        
    </div>
    <div>
        <button @click="back">退出登录</button>
    </div>
</template>
  
<script setup>

import { useRouter } from "vue-router";
import router from "../router/router";

function back(){
    router.push("/");
}

    
</script>

<style scoped>
.navigate{
    display: flex;
}
</style>