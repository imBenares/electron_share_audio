import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/router";
import audioplayer from "@/components/audioplayer.vue";
import sidebar from "./components/sidebar.vue";
import VueDatePicker from '@vuepic/vue-datepicker';
import { createPinia } from "pinia";

const app = createApp(App);
app.component('VueDatePicker', VueDatePicker);
app.component('audioplayer',audioplayer);
app.component('siderbar',sidebar);
app.use(createPinia());
app.use(router).mount('#app');
