<template>
    <div>
    <audioplayer id="audioplayer" />
    </div>
    <siderbar/>
    
    <div class="main-content">
        <router-view></router-view>
    </div>
    <div id="background">
        <img id="backgroundimg" src="@/../public/background.jpg">
    </div>
</template>


<script setup>
import { RouterView  } from 'vue-router';

  
</script>

<style scoped>
.main-content{
    position: absolute;
    top: 0;
    left: 180px;
    right: 0;
    bottom: 80px; /* 留出80px的空间 */
    overflow-y: auto; /* 使内容可滚动 */
    
}
   
#background{
    position: fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    right: -1%;
    top: 0px;
    bottom: 0px;
    filter: blur(16px);
    z-index: -1;
}

#backgroundimg{
    width: 1400px;  
    height: 1000px;  
}


</style>