export default (api: any) => {
  console.log("执行了 version 插件");
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
