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
    top: 0px;
    left: 180px;
    height: auto;
    width: auto;
    right: 0px;
    bottom: 0px;
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