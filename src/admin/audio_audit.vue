<template>
    <div class="audiolists">
        <ul v-for="(audiolist) in audiolists" :key="audiolist.id" class="audiolist">
            <div>
                <div id="audioname">
                    {{ audiolist.audio_name }}
                </div>
            </div>
        </ul>
    </div>

</template>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';

const audiolists = ref(null);

const recommend = async() => {
    const response = await fetch("http://localhost:3000/recent-audio");
    const result = await response.json();
    console.log(result);
    
    audiolists.value = result.data; 
}

onMounted(async () => {
    await recommend();
});

</script>

<style scoped>



</style>