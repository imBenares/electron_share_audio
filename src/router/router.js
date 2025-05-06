import { createRouter,createWebHashHistory } from "vue-router";
import mainpage from '@/pages/mainpage/mainpage.vue';
import login from '@/pages/login/login.vue';
import home from '@/pages/home/home.vue';
import filebrower from '@/pages/filebrower/filebrower.vue';
import personal from "@/pages/personal/personal.vue";
import register from "@/pages/register/register.vue";
import edit from "@/pages/edit/edit.vue";
import admin from '@/admin/admin.vue';
import audio_audit from '@/admin/audio_audit.vue';
import comment_audit from '@/admin/comment_audit.vue';
import user_audit from '@/admin/user_audit.vue';

const routes=[
    {
        path:'/',
        name:'login',
        component:login,
    },
    {
        path:'/register',
        name:'register',
        component:register,
    },
    {
        path:'/mainpage',
        name:'mainpage',
        component:mainpage,
        redirect: { name: 'home' },
        children:[
            {
                path:'home',
                name:'home',
                component:home,
            },
            {
                path:'filebrower',
                name:'filebrower',
                component:filebrower,
            },
            {
                path:'personal',
                name:'personal',
                component:personal,
            },
            {
                path:'edit',
                name:'edit',
                component:edit,
            },
            
        ]
    },
    {
        path:'/admin',
        name:'admin',
        component:admin,
        children:[
            {
                path:'/audio_audit',
                name:'audio_audit',
                component:audio_audit,
            },
            {
                path:'/comment_audit',
                name:'comment_audit',
                component:comment_audit,
            },
            {
                path:'/user_audit',
                name:'user_audit',
                component:user_audit,
            }
        ]
    },  
]

const router = createRouter({
    history:createWebHashHistory(),
    routes,
});

router.beforeEach((to,from,next) => {
    if (to.path === '/' || to.path === '/login') {
        // 每次访问登录页前清空登录状态
        localStorage.clear()
      }
    const isAuthenticated = localStorage.getItem("isLoggedIn");
    if (!isAuthenticated && !["/",  "/register","/login"].includes(to.path)) {
      next("/"); // 未登录，重定向到登录页面
    } else {
      next(); // 继续导航
    }
  });

export default router;

