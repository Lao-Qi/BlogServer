# LaoQiBlogServer

王老柒的博客服务器

使用技术：

-   express
-   typescript
-   typeorm
-   sqlite3
-   pm2

功能:

-   SessionKey 密钥登录认证
-   JWT 身份认证
-   基本数据的 CRUD
-   简单的打包方式
-   基础的文件上传
-   大文件切片上传

运行：

1.  运行`npm install`或`yarn`
2.  运行`npm run dev`或`yarn dev`
    推荐使用`yarn`

部署(ubuntu(22 版本) 示例)：

1.  本地运行`npm run build`或`yarn build`生成`dist.zip`压缩包
2.  `Ubuntu`安装`Nodejs >= 18`
3.  安装前置库`npm install yarn pm2`
4.  将`dist.zip`上传到`Ubuntu`系统
5.  `sudo unzip dist.zip`解决文件
6.  `sudo pm2 start ecosystem.config.js`启动项目

使用：
该服务器可搭配`BlogServerTool`来进行管理

管理员登录：
此服务器目前是用`sessionKey.key`文件来认证管理员的，`sessionKey.key`文件会在服务器启动时生成在服务器目录下，需要服务器运维人员将其拉去到本地，并使用`BlogServerTool`登录

    这个认证方式后续会改成，在本地生成`sessionKey.key`并上传到服务器目录下被其使用。
