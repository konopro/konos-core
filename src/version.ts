export default (api: any) => {
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
