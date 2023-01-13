export default (api: any) => {
  api.onStart(() => {
    console.log("开始：执行了 version 插件");
  });
  api.onEnd(() => {
    console.log("结束：执行了 version 插件");
  });
  api.registerCommand({
    name: "version",
    alias: "v",
    description: "show konos version",
    fn({}) {
      const version = require("../package.json").version;
      console.log(`konos@${version}`);
      return version;
    },
  });
};
