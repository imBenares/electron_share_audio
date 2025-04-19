<template>
    
</template>

<script setup>
import { ref } from 'vue';

let filemessage = null;

const uploadBtn = async () => {
    filemessage = await fileAPI.selectFile();
    if(filemessage.message == 'E00'){
        return;
    }
}
    
</script>

<style scoped>
   
</style>