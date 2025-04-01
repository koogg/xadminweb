# xadmin-client

xadmin-基于 Django+vue3 的 rbac 权限管理系统

基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 二次开发

Django 做后端服务
[xadmin-server](https://github.com/nineaiyu/xadmin-server)


## 开发文档

[https://docs.dvcloud.xin/](https://docs.dvcloud.xin/)

## docker 构建

修改 api 配置文件`.env.production`，将 api 域名修改为自己服务器，然后进行构建

```shell
docker compose up xadmin-client-build
```

### docker 启动

```shell
docker compose up xadmin-client-prod
```

然后浏览器 http://localhost:8891 进行访问

# 本地开发运行，记得在`vite.config.ts` 添加proxy代理，要不然无法访问api服务

```ts
      proxy: {
  "/api"
:
  {
    target: "http://127.0.0.1:8896",
      changeOrigin
  :
    true,
      rewrite
  :
    path => path
  }
,
  "/media"
:
  {
    target: "http://127.0.0.1:8896",
      changeOrigin
  :
    true,
      rewrite
  :
    path => path
  }
,
  "/ws"
:
  {
    target: "ws://127.0.0.1:8896"
  }
,
  "/api-docs"
:
  {
    target: "http://127.0.0.1:8896",
      changeOrigin
  :
    true,
      rewrite
  :
    path => path
  }
}
,
```
## 项目结构
~~~
├── build
├── build.sh                            # 构建就脚本
├── commitlint.config.js
├── docker-compose.yml                  # docker compose 运行文件
├── Dockerfile                          # 用与构建容器镜像文件
├── eslint.config.js
├── index.html
├── LICENSE
├── locales                             # 国际化
├── mock
├── package.json                        # 环境依赖
├── pnpm-lock.yaml
├── postcss.config.js
├── public
├── src                                 # 主要源码
│   ├── api                 # 接口api
│   ├── App.vue
│   ├── assets
│   ├── components          # 组件库
│       ├── RePlusSearch    # 后端对应搜索组件-重要！！！
│       ├── RePlusPage      # 页面组件-重要！！！
│   ├── config              # 项目配置
│   ├── constants
│   ├── directives
│   ├── layout              # 项目框架
│   ├── main.ts
│   ├── plugins
│   ├── router              # 路由
│   ├── store
│   ├── style
│   ├── utils           
│   └── views               #页面
├── stylelint.config.js
├── tailwind.config.ts
├── tsconfig.json
├── types
└── vite.config.ts
~~~