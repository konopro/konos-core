export default (api: any) => {
  api.onStart(() => {
    console.log("开始：执行了 other 插件");
  });
  api.onEnd(() => {
    console.log("结束：执行了 other 插件");
  });
};
