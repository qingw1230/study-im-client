<template>
  <div class="message-content-my" v-if="data.sendId == userInfoStore.getInfo().userId">
    <div :class="['content-panel', data.contentType != 101 ? 'content-panel-media' : '']">
      <div class="sending" v-if="data.status == 9999"> </div>
      <template v-else>
        <div class="content" v-html="data.content" v-if="data.contentType == 101"></div>
        <div class="content" v-else> </div>
      </template>
    </div>
  </div>
  <div class="message-content-other" v-else>
    <div :class="['content-panel', data.contentType != 101 ? 'content-panel-media' : '']">
      <div class="nick-name" v-if="data.sessionType == 2"> {{ data.senderNickName }} </div>
      <div class="sending" v-if="data.status == 9999"> </div>
      <template v-else>
        <div class="content" v-html="data.content" v-if="data.contentType == 101"></div>
        <div class="content" v-else> </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useUserInfoStore } from '@/stores/UserInfoStore'

const userInfoStore = useUserInfoStore()


const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
  currentChatSession: {
    type: Object,
    default: {},
  }
})

</script>

<style lang="scss" scoped>
.sending {
  width: 170px;
  height: 170px;
  overflow: hidden;
  float: right;
  margin-right: 5px;
  border-radius: 5px;

  .skeleton-item {
    width: 170px;
    height: 170px;
  }
}

.content {
  display: inline-block;
  padding: 8px;
  color: #474747;
  border-radius: 5px;
  text-align: left;
  font-size: 14px;

  :deep(.emoji) {
    font-size: 20px;
  }
}

.content-panel {
  flex: 1;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    display: block;
    width: 10px;
    height: 10px;
    background: #95ec69;
    transform: rotate(45deg);
    border-radius: 2px;
    top: 13px;
  }
}

.content-panel-media {
  .content {
    border-radius: 5px;
    background: none !important;
    overflow: hidden;
    padding: 0px;
  }

  &::after {
    display: none;
  }
}

.message-content-my {
  display: flex;

  .content-panel {
    margin-right: 10px;
    text-align: right;
    padding-left: 32%;

    .content {
      background: #95ec69;
    }

    &::after {
      right: -4px;
    }
  }
}

.message-content-other {
  display: flex;
  padding-right: 32%;

  .user-avatar {
    margin-right: 10px;
    width: 35px;
    height: 35px;
  }

  .content-panel {
    flex: 1;
    position: relative;
    text-align: left;

    .nick-name {
      font-size: 12px;
      color: #b2b2b2;
    }

    .content {
      background: #fff;
    }

    .sending {
      float: left;
    }

    &::after {
      left: -4px;
      background: #fff;
    }
  }

  .content-panel-media {
    justify-content: flex-start;
  }
}

.group-content {
  margin-top: -6px;

  .content {
    margin-top: 6px;
  }

  &::after {
    left: -4px;
    top: 35px;
    background: #fff;
  }
}
</style>
