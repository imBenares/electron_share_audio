<template>
    <div class="audiolists">
        <div style="margin-bottom: 10px;">
            每页显示：
            <select v-model="perPage">
                <option v-for="num in [3, 5, 10, 20]" :key="num" :value="num">{{ num }}</option>
            </select>
        </div>
        <ul v-for="userlist in paginatedUsers" :key="userlist.id" class="userlist">
          <div class="contect">
              <div class="list">
                  <div class="user_info">
                      <div>
                          <img ref="headshot" id="headshotimg" :src="userlist.headshotpath ? `local://0/${userlist.headshotpath}` : defaultheadshot" />
                      </div>
                      <div class="username">
                              {{ userlist.username }}
                      </div>
                  </div>
                  <div class="list_control">
                      <button id="checkuser" @click="checkuser(userlist.id)">查看详情</button>
                  </div>
              </div>
              <div v-if="ischecking[userlist.id]" class="user-details">
                <div class="details">
                  <div class="info">
                      <div>
                          userid:{{formatuserid(userlist.user_id)}}
                      </div>
                      <div>
                          生日:{{formatbirthdate(userlist.birthdate)}}
                      </div>
                      <div>
                          性别:{{formatgender(userlist.gender)}}
                      </div>
                      <div>
                          email:{{userlist.email}}
                      </div>
                      <div>
                          电话:{{userlist.tel}}
                      </div>
                  </div>
                    <div class="permission-details">
                        <div>
                            <label>
                              上传权限
                            <input
                                type="checkbox"
                                v-model="userlist.upload_permissions"
                                :true-value="1"
                                :false-value="0"
                            />
                            </label>
                        </div>
                        <div>
                            <label>
                              评论权限
                            <input
                                type="checkbox"
                                v-model="userlist.comment_permissions"
                                :true-value="1"
                                :false-value="0"
                            />
                            </label>
                        </div>
                        <div>
                            <button @click="savePermission(userlist)">保存权限</button>
                        </div>
                    </div>
                </div>
              </div>
          </div>
        </ul>
        <div v-if="pageCount > 1" class="pagination-buttons">
            <button
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
              class="pagination-btn"
            >
              上一页
            </button>
            <div v-for="(page, index) in visiblePages" :key="index">
              <span
                v-if="page.text === '...'"
                class="pagination-ellipsis"
              >
                ...
              </span>
              <button
                v-else
                :disabled="page.disabled"
                @click="changePage(page.number)"
                :class="[
                  'pagination-btn',
                  { active: currentPage === page.number },
                  { special: page.number === 1 || page.number === pageCount }
                ]"
              >
                {{ page.text }}
              </button>
            </div>
            <button
              :disabled="currentPage === pageCount"
              @click="changePage(currentPage + 1)"
              class="pagination-btn"
            >
              下一页
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed  } from 'vue';
import defaultheadshot from '/blankheadshot.png';
import Paginate from 'vuejs-paginate-next';


let data = null;
let response;
const userlists = ref([]);
const ischecking = ref({});
const currentPage = ref(1);
const perPage = ref(5);

const recommend = async() => {
    response = await fetch("http://localhost:3000/recent-user");
    const result = await response.json();
    //console.log(result);
    userlists.value = result.data; 
    console.log(result.data);
    
}

const checkuser = async(id) => {
    ischecking.value = [];
    ischecking.value[id] = true;
    
}

function formatuserid(userid){
    userid = userid + 100000;
    return userid;
}

function formatbirthdate(birthdate){
    const date = new Date(birthdate);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatgender(gender){
    if (gender == 1) {
      gender = "男";
    } else if (gender == 2) {
      gender = "女";
    } else {
      gender = "保密";
    }
    return gender;
}

const savePermission = async (user) => {
  const response = await fetch("http://localhost:3000/update-permission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      uploadPermission: user.upload_permissions,
      commentPermission: user.comment_permissions,
    }),
  });

  const result = await response.json();
  if (result.success) {
    alert("权限更新成功！");
  } else {
    alert("权限更新失败：" + result.message);
  }
};

const paginatedUsers = computed(() => {
  if (!userlists.value) return [];
  const start = (currentPage.value - 1) * perPage.value;
  return userlists.value.slice(start, start + perPage.value);
});

const pageCount = computed(() => {
  if (!userlists.value) return 0;
  return Math.ceil(userlists.value.length / perPage.value);
});

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pageCount.value) {
    currentPage.value = newPage;
  }
};

const visiblePages = computed(() => {
  const total = pageCount.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 7) {
    // 全部显示
    for (let i = 1; i <= total; i++) {
      pages.push({ text: i, number: i, disabled: false });
    }
  } else {
    pages.push({ text: '1', number: 1, disabled: false });

    if (current <= 4) {
      
      for (let i = 2; i <= 5; i++) {
        pages.push({ text: i, number: i, disabled: false });
      }
      pages.push({ text: '...', number: null, disabled: true });
    } else if (current >= total - 3) {
      // 靠近尾部：首页 + ... + 后 4 页
      pages.push({ text: '...', number: null, disabled: true });
      for (let i = total - 4; i < total; i++) {
        pages.push({ text: i, number: i, disabled: false });
      }
    } else {
      
      pages.push({ text: '...', number: null, disabled: true });
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push({ text: i, number: i, disabled: false });
      }
      pages.push({ text: '...', number: null, disabled: true });
    }

    pages.push({ text: total, number: total, disabled: false });
  }

  return pages;
});

onMounted(async () => {
    await recommend();
});

</script>

<style scoped>

.userlist{
    display: flex;
    flex-direction: column;
    padding: 0px;
}

.list{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin:0px 30px;
    padding: 10px 40px;
    border-radius: 7px;
    background-color:#c6cbd856 ;
}

.list:hover{
  background-color: #73778056;
}

.user-details{
  margin: 0px 80px;
  background-color: #9397a156;
  border-radius: 0px 0px 7px 7px;
}

.details{
  display: flex;
  margin: 10px 60px;
}

.user_info{
  display: flex;
}

.permission-details{
  margin-left: 100px;
}

button{
    border: solid 0px;
    background-color: #c2c5cc;
    padding: 5px 10px;
    border-radius: 5px;
}

button:hover{
    background-color: #8b8e94;
    color: #ffffff;
}

.username{
  margin-left: 20px;
  margin-top: 16px;
}

.contect{
    display: flex;
    flex-direction: column;
}

.checkuser{
    display: flex;
    gap: 10px;
    margin-right: 40px;
}

.list_control{
    display: flex;
    gap: 10px;
    right: 50px;
}

#headshotimg{
    height: 50px;
    border:1px solid #ffffff;
    border-radius: 50%;
    margin-top: 2px;
}

.user-details{
    display: flex;
    flex-direction: column;
}

.pagination {
  display: flex;
  list-style: none;
  justify-content: center;
  padding: 0;
  margin-top: 20px;
}

.pagination li {
  margin: 0 5px;
  cursor: pointer;
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.pagination li.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.pagination-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.pagination-btn {
  margin: 0 4px;
  padding: 6px 12px;
  cursor: pointer;
  border: 0px solid #ccc;
  background: none;
  color: #333;
  border-radius: 4px;
}
.pagination-btn.active {
  background-color: #3498db; 
  color: white;
  font-weight: bold;
  border-color: #3498db;
}

.pagination-btn.special {
  background-color: #3498db; /* 绿色背景 */
  color: white;
  font-weight: bold;
  border-color: #3498db;
}

.pagination-ellipsis {
  margin: 0 6px;
  color: #999;
  user-select: none;
}

.pagination-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

</style>