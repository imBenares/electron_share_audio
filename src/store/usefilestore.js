import { defineStore } from "pinia";

export const useFileStore = defineStore("fileStore", {
    state:()=>({
      fileList:{},
    }),
    //创建一个名为fileList的数组变量，用于承接从filebrower来的文件路径列表
    
    actions:{
      setFileList(newList){
        this.fileList = newList;
      },
    },
});

export const useFileName = defineStore("fileName", {
  state:()=>({
    nameList:{},
  }),
  //创建一个名为fileList的数组变量，用于承接从filebrower来的文件路径列表
  
  actions:{
    setNameList(newList){
      this.nameList = newList;
    },
  },
});