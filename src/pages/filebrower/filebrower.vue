<template>
    <h1>filebrower</h1>
    <button @click="filebrower">点我浏览本地文件</button>

    
</template>

<script setup>
import { useFileStore,useFileName } from "@/store/usefilestore";
import { storeToRefs } from "pinia";

    let audioFiles=null;
    let audioname=null;

    const filebrower = async()=>{
        //核心函数，异步函数
        const folderPath=await fileAPI.selectFolder();
        //调用预加载脚本的fileAPI里的selectFolder方法并将返回值传入folderPath
        //folderPath用于承接从方法中传过来的绝对文件路径

        audioFiles=await fileAPI.readFolder(folderPath);
        //调用预加载脚本的fileAPI里的readFolder方法，传入folderPath，并将返回值传入audioFiles
        //audioFiles用于承接从方法中传过来的所有音频文件的绝对路径

        audioname = await fileAPI.getFileName(audioFiles);
        //调用预加载脚本的fileAPI里的getFileName方法，传入audioFiles，并将返回值传入audioname
        //audioname用于承接从方法中传过来的所有音频文件名称   
        
        const filestore = useFileStore();
        filestore.setFileList(audioFiles);

        const filename = useFileName();
        filename.setNameList(audioname);
    }

    function test(){
        console.log("hello,world");

    }

   test();
    
</script>

<style scoped>

</style>